.. _pof__loader_general_settings:

General Settings
----------------

Configuring the General Settings will control the loader behavior.

.. image:: general_settings.png

----

:Graph Import Parallelism: The number of simultaneous segments to load into the graphdb.
    connectivity data.

:Graph Import Period (s): The frequency at which the loader plugin will requery the
    connectivity model from PowerOn

:Trace Import Parallelism: The number of simultaneous trace configs to load
    into the graphdb.

:Trace Import Period (s): The frequency at which the loader plugin will requery the
    trace configs from PowerOn

:Oracle Fetch Size: The number of rows load in each result set fetch call to Oracle.

:Oracle Fetch Pause (ms): Should the loader wait between each chunk of data fetched
    from oracle.


----

#.  Select the "Edit General Settings"

#.  Edit the setting

#.  Click Save

.. note:: You will have to restart the agent for these changes to take effect.
