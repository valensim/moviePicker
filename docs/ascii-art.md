# ASCII art

Save a picture as text art. Later, type its name and the bot posts that art in chat.

## Save a picture

Use `/ascii-save`.

- **name**: a short name, such as `cat` or `my cat`. Letters, numbers, and hyphens only. Up to 32 characters. Spaces turn into hyphens, so `My Cat` is stored as `my-cat`.
- **image**: a PNG, JPG, or GIF under 8 MB.

The bot matches the picture's shape. A tall photo stays tall, and a wide photo stays wide. It still fits in one Discord message. Phone photos that were stored sideways are turned upright. It does not keep the original picture. A GIF uses only the first frame. Pictures saved before this change keep their old shape until you save them again.

Saving the same name again replaces the old art.

## See every name

Use `/ascii-list`. It posts each saved name. If there are too many for one message, it shows as many as fit and says how many are left.

## Show a picture

Use `/ascii` and the name you saved, for example `my-cat`.

The art comes back in one message, inside a code block, so the columns stay lined up.

## When it does not work

- The name must use letters, numbers, and hyphens.
- The file must be an image. PNG, JPG, and GIF work. WebP may fail.
- Restart the bot once so Discord learns the new commands. They can take a few minutes to show up.
