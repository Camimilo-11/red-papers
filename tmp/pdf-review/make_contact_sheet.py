from pathlib import Path
from PIL import Image, ImageDraw
folder = Path(r'C:\Users\THINKPAD\Documents\GitHub\red-papers\tmp\pdf-review')
files = sorted(folder.glob('page-*.png'))
thumb_w, thumb_h, cols = 250, 324, 4
rows = (len(files) + cols - 1) // cols
sheet = Image.new('RGB', (cols * thumb_w, rows * (thumb_h + 28)), '#e7ebef')
draw = ImageDraw.Draw(sheet)
for index, path in enumerate(files):
    page = Image.open(path).convert('RGB')
    page.thumbnail((thumb_w - 16, thumb_h - 12))
    x = (index % cols) * thumb_w + (thumb_w - page.width) // 2
    y = (index // cols) * (thumb_h + 28) + 6
    sheet.paste(page, (x, y))
    draw.text(((index % cols) * thumb_w + 10, (index // cols) * (thumb_h + 28) + thumb_h + 2), f'Pagina {index + 1}', fill='#18232d')
sheet.save(folder / 'contact.png')
