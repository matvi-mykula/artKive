Image workflow for this project:

1. Create one folder per work inside public/images/.
2. Use the work slug as the folder name.
3. Put a cover image and any additional images in that folder.
4. Update src/data.js with the filenames in display order.
5. Optionally add a blurb.txt file in the same folder for the work page text.

Recommended structure:

public/images/night-window/cover.jpg
public/images/night-window/01.jpg
public/images/night-window/02.jpg
public/images/field-notes/cover.jpg

Blurb text files:

- store them beside the images as blurb.txt
- use [[tag]] for a linked tag word
- use [[tag|visible phrase]] when the linked phrase should differ from the tag slug

Example:

This [[lamp]] is built from cut [[stone]].

Recommended filename rules:

- lowercase only
- no spaces
- use jpg for photos unless png is necessary
- keep the longest edge around 1600-2200px

The current folders include SVG placeholders so the app works before you add real artwork.
