Overview
--------

The following sections describe the parts of the Peek Diagram plugin.

Importers
`````````

The diagram needs to be populated with data, this task is carried out by other plugins.

The loader plugins populate the Lookups, Display items an Display LiveDB Links.

Multiple importers can import into the one coordinate set, the Diagram will merge these
data sets into one diagram.

Client Cache
````````````

For performance reasons, all data for the Peek Diagram is cached in memory in the client
service.

Manual database changes outside of Peek Admin will require a restart of the Peek Client.

Model Set
`````````

The diagram can have multiple isolated data/model sets in it.
Each model set has it's own set of lookups, coordinate sets and display items.

Coordinate Set
``````````````

A coordinate set is where the display items live. One or more coordinate sets live
within each model set, using the lookups within the model set.

Lookups
```````

The Peek Diagram has several lookup types. Lookups are used to store display details
for each display item.

This provides easier global changes and a smaller display item object.


:Color:

:Text Style:

:Line Style:

:Level:

:Layer:


Display Items
`````````````

Grids
`````

Z Grids
```````

Location Index
``````````````

Branches
````````

Deltas
~~~~~~

