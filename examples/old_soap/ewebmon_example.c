// VS_PoFFastScan.cpp : Defines the entry point for the console application.
//


#include <stdio.h>
#include <memory.h>

#ifndef WIN32
#include <netinet/in.h>
#include <unistd.h>
#endif

#ifdef WIN32
#include <Winsock2.h>
#endif

#include <time.h>

/*F-----------------------------------------------------------------------------
 *F  Function : main
 *F
 *F  To compile, run the following where XXX is your target executable name,
 *F
 *F  cc -o XXX VS_PoFFastScan.cpp
 *F
 *F  The request to register for a set of attributes is as follows,
 *F
 *F  DYNAMICS
 *F  <count of attributes>
 *F  <data size>
 *F  <NULL>
 *F  <attributeID> 0 <row> <column> [currentValue]
 *F  <attributeID> 0 <row> <column> [currentValue]
 *F  ...
 *F
 *F  The value 0 after the attributeID indicates the "current" value is required.
 *F  For scalar attributes, row and column should be set to 0.
 *F  The current value can optionally be supplied if you have one, such that if
 *F  the attribute is still that value, you will not get an update following
 *F  registration of the attribute.
 *F  Registration for a set of attributes can be done initially and on an
 *F  on-going basis.
 *F
 *F  The response following initial registration is as follows,
 *F
 *F  DYNUPDATE
 *F  <attributeID> 0 <row> <column> <valueType> <currentValue>
 *F  <attributeID> 0 <row> <column> <valueType> <currentValue>
 *F  ...
 *F
 *F  Subsequent changes are sent as above without the DYNUPDATE header.
 *F
 *F  The values for <valueType> are 0 (INT), 1 (FLOAT), or 2 (TEXT).
 *F
 *F---------------------------------------------------------------------------*/
#define BBUF_SIZE 256

int main (int argc, char **argv)
{
    FILE *fp = NULL;
	//FILE *fout = NULL; // this is the file we are going to write to.

    struct sockaddr_in addr;

    int skt = -1;
    int status = 0;
    int len = 0;
    int size = 0;
    int i = 0;
    int count = 0;

    char buffer[256];
    char buildbuf[BBUF_SIZE];

	char *data =
		"D006c6591ATTR 0 0 0\n";		// this is EU Value for BAS_B2XD_VC
//		"G00094b0dATTR 0 0 0\n"		// this is EU Value for BAS_B2XD_VB
//		"G00094ac2ATTR 0 0 0\n"		// this is EU Value for BAS_B2XD_VA
//		"G0002e6e7ATTR 0 0 0\n"		// this is the EU Value for BAS22_IA
//		"G0002e733ATTR 0 0 0\n"		// this is the EU Value for BAS22_IB
//		"G0002e77fATTR 0 0 0\n"		// this is the EU value for BAS22_IC
//		"G0002e7cbATTR 0 0 0\n"		// this is the EU value for BAS22_IN
//		"G0002e817ATTR 0 0 0\n"		// this is the EU value for BAS22_IG
//		"G0002ebf3ATTR 0 0 0\n"		// this is the EU value for BAS22_MW_3_PHASE
//		"G0002ecebATTR 0 0 0\n";	// this is the EU value for BAS22_MVAR_3_PHASE


/*
 *  Work out size of input string
 */
    size = strlen(data) * sizeof(char);
/*
 *  Get the number of lines
 */
    for (i=0; i<size; i++)
    {
        if (data[i] == '\n') count++;
    }
/*
 *  Set the address length
 */
    len = sizeof(struct sockaddr_in);
/*
 *  Clear the address
 */
    memset(&addr, 0, len);
/*
 *  Fill it in
 */
    addr.sin_family      = AF_INET;
    addr.sin_port        = htons(15028);
    addr.sin_addr.s_addr = htonl(INADDR_LOOPBACK);
/*
 *  Create an AF_INET socket
 */
    if ((skt = socket(AF_INET, SOCK_STREAM, 0)) < 0)
    {
        fprintf(stderr, "Failed to create socket\n");
        status = -1;
    }
/*
 *  Connect to the service
 */
    else if (connect(skt, (void *) &addr, len) == -1)
    {
        fprintf(stderr, "Failed to bind socket to address\n");
        status = -1;
    }
/*
 *  Get a read/write file pointer on the socket
 */
    else if ((fp = fdopen(skt, "rb+")) == NULL)
    {
        fprintf(stderr, "Failed to get read/write file pointer for socket %d", skt);
        status = -1;
    }
/*
 *  Send the header
 */
    else if ( (fprintf(fp,
                       "DYNAMICS\n%d\n%d\n%c",
                       count,
                       size,
                       0) < 0) ||
              (fflush(fp) < 0) )
    {
        fprintf(stderr, "Failed to send header\n");
        status = -1;
    }
/*
 *  Send the data
 */
    else if ( (fwrite(data,
                      1,
                      size,
                      fp) != size) ||
              (fflush(fp) < 0) )
    {
        fprintf(stderr, "Failed to send data\n");
        status = -1;
    }
/*
 *  Get the responses (continuously)
 */

    else
    {
		//if ((fout = fopen(".\fastscan.txt", "w")) == NULL)
		//{
		//  fprintf(stderr, "Failed to open output file\n");
        //   status = -1;
		//}
		//else
	   	{
           memset(buffer, 0 ,256);
           memset(buildbuf, 0, BBUF_SIZE);
		   count = 0;

           while ((fgets(buffer, 256, fp) !=NULL))
           {
			   if ((count + strlen(buffer)) >= BBUF_SIZE-1)
			   {
				   fprintf(stderr, "buffer overflow while reading");
			   }
			   else
			   if (buffer[strlen(buffer)-1] == '\n') // have got a complete dump
			  {
                  time_t rawtime;
                  struct tm * tinfo;
                  time ( &rawtime );
                  tinfo = localtime ( &rawtime );
				  strcat(buildbuf, buffer);
                  fprintf (stdout, "%02d/%02d/%d %02d:%02d:%02d, %s",
                                   tinfo->tm_mday,
                                   tinfo->tm_mon + 1,
                                   tinfo->tm_year + 1900,
                                   tinfo->tm_hour,
                                   tinfo->tm_min,
                                   tinfo->tm_sec,
                                   buildbuf);
			      fflush(stdout);
                  memset(buildbuf, 0, BBUF_SIZE);
                  memset(buffer, 0 , 256);
				  count = 0;
			  }
              else
              {
                  strcat(buildbuf, buffer);
				  count += strlen(buffer);
              }
           }
		}
    }
/*
 *  Close the file pointer
 */
    if (fp)
    {
        fclose(fp);
    }
	//if (fout)
	//{
	//	fclose (fp);
	//}
/*
 *  Close the service
 */
    if (skt != -1)
    {
        close(skt);
    }

    return status;
}