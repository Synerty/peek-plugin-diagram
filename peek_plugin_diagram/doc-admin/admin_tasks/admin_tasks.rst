Admin Tasks
-----------

This section describes how to perform administration tasks for the
Connectivity Loader plugin.

Monitor Status
``````````````

The progress / status of the PoF Connectivity Loader can be viewed in the Peek Admin UI
on the **Loader Status** page.

There is a lot of processing to convert the connectivity model from the oracle tables
into the Peek GraphDB format, the next few images will give some detail to the states
the loader goes though.

----

First the segment loader loads all the components from the PowerOn oracle database.

.. image:: admin_task_status_loading_from_oracle.png

----

The Agent then links the model in memory (often too fast to see),
then splits the model into segments at the components that match the split point config.

.. image:: admin_task_status_splitting_into_segments.png

----

Once the model has been converted to segments, the segments are then imported into the
graphdb plugin. The parallelism of this task is configurable in general settings.

.. image:: admin_task_status_loading_into_graphdb.png


----

When the loader has completed loading, the **Queued** value should be zero.

.. image:: admin_task_status_loading_complete.png

Reloading to Segments
`````````````````````

This admin task will reset the loader plugins state for the segments it's loaded
into the GraphDB, causing the plugin to re-import all the segment into the
GraphDB plugin when it starts next.

----

#.  Stop the Peek Agent service

#.  Execute the following SQL ::


        -- Reset the state for the connectivity model segments
        TRUNCATE pl_pof_graphdb_loader."GraphSegmentLoadState";


#.  Start the Peek Agent service

----

Peek will now re-import the segments into the GraphDB plugin.


