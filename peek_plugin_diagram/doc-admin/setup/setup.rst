.. _diagram_setup:

Setup
-----

This section describes the initial connection of the Peek PoF Connectivity Loader
plugin to PowerOn Fusion/Advantage.

Connection Settings
```````````````````

To get started, configure the plugin from the admin section of Peek Admin.

----

Configure the App Server Settings,
this connects the connectivity loader to the PowerOn Fusion/Advantage app server.

.. image:: setup_app_server_settings.png

----

:App Server Hosts: Set the IP of the app server, this will be used for the oracle
    connection.

:Oracle Username: The user to connect to oracle with.

:Oracle Password: The password to connect to oracle with.

----

#.  Select the "Edit App Server Settings"

#.  Fill out the connection details.

#.  Set the "Enabled" button.

#.  Click Save

----

Segment Split Points
````````````````````

The PoF Connectivity Loader splits the PowerOn model up into segments, this is
required for the GraphDB plugin.

This splitting is achieved using "split points", and split points are identified
by a set of matching criteria defined in the Peek Admin UI.

----

:Class: The ID of the PowerOn component class.
    :code:`COMPONENT_HEADER.COMPONENT_CLASS`

:Trace Class: The ID of the PowerOn Fusion component trace class.
    :code:`COMPONENT_HEADER.COMPONENT_SWITCH_STATUS`

:Alias: A regular expression matching a component alias.
    :code:`COMPONENT_HEADER.COMPONENT_ALIAS`

:Name: A regular expression matching a component name.
    :code:`COMPONENT_HEADER.COMPONENT_PATHNAME`

:Comment: A comment to describe the types of components this criteria is intended to
    match.

----

To add the split point criteria, follow this procedure:

#.  Open the Peek Admin UI and navigate to the **PoF Connectivity Loader** plugin.

#.  Select the **Edit Segment Split Points** tab.

#.  Click **+**

#.  Fill out the criteria (see above)

#.  Click save.

.. image:: setup_configure_split_points.png

----

Restart the Peek Agent and tail the agent log on the server.

The loader will reload and resplit the connectivity model,
importing, updating and deleting semgnets into the GraphDB plugin as required.



