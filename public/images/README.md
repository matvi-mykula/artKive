Image workflow for this project:

1. Create one folder per work inside public/images/.
2. Use the work slug as the folder name.
3. Put a cover image and any additional images in that folder.
4. Update src/data.js with the filenames in display order.
5. Add a blurb.txt file for the archive card text and a description.txt file for the work page text.

Recommended structure:

public/images/night-window/cover.jpg
public/images/night-window/01.jpg
public/images/night-window/02.jpg
public/images/field-notes/cover.jpg

Text files:

- store them beside the images as blurb.txt and description.txt
- use [[tag]] for a linked tag word
- use [[tag|visible phrase]] when the linked phrase should differ from the tag slug

Example:

blurb.txt
This [[lamp]] is built from cut [[stone]].

description.txt
This [[lamp]] is built from cut [[stone]]. The piece sits between object and [[sculpture]].

Recommended filename rules:

- lowercase only
- no spaces
- use jpg for photos unless png is necessary
- keep the longest edge around 1600-2200px

The current folders include SVG placeholders so the app works before you add real artwork.
