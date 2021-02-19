Used provided reference code from TA, as a base, then heavily modified it.

Unimplemented Features: Butterfly and loop subdivision

Notes:
- In script.js, between "EDITABLE REGION" and "GUI operations", there are a set of literal values that can edited before running the program, which are not specified in the GUI
- While in the application, the user must first hit the "Load File" button to load a file into the GUI
- Upon loading files or changing shade displays: Large files may take some time to load, due to shading, despite the page "not responding" (2.5 minutes for 20000 vertices)
- Upon hittig "Save File", the .obj file, with normalized vertices from [-1, 1], will be downloaded