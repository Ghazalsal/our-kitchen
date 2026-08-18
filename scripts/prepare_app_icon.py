from pathlib import Path
from PIL import Image

source = Path('/home/ubuntu/webdev-static-assets/our-kitchen-logo-source.jpg')
output_dir = Path('/home/ubuntu/webdev-static-assets')

image = Image.open(source).convert('RGBA')
width, height = image.size

# The supplied artwork places the utensil crest on the left; preserve it as a
# recognizable square app mark with generous dark breathing room.
crest = image.crop((0, 0, int(width * 0.52), height))
side = max(crest.size)
canvas = Image.new('RGBA', (side, side), (10, 10, 9, 255))
canvas.alpha_composite(crest, ((side - crest.width) // 2, (side - crest.height) // 2))
canvas.resize((512, 512), Image.Resampling.LANCZOS).save(output_dir / 'our-kitchen-app-icon.png', 'PNG', optimize=True)

# Keep the full bilingual artwork for the header and protected workspace.
image.save(output_dir / 'our-kitchen-brand-logo.png', 'PNG', optimize=True)
