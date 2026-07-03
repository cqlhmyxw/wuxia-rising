# 武侠·崛起 — App Store 上线准备

## 生成App图标
python3 << 'PYEOF'
from PIL import Image, ImageDraw, ImageFont
import os

sizes = {
    "icon_20.png": 20, "icon_20@2x.png": 40, "icon_20@3x.png": 60,
    "icon_29.png": 29, "icon_29@2x.png": 58, "icon_29@3x.png": 87,
    "icon_40.png": 40, "icon_40@2x.png": 80, "icon_40@3x.png": 120,
    "icon_60@2x.png": 120, "icon_60@3x.png": 180,
    "icon_76.png": 76, "icon_76@2x.png": 152,
    "icon_83.5@2x.png": 167,
    "icon_1024.png": 1024,
}

outdir = "/home/ubuntu/wuxia-rising/app-assets/icons"
os.makedirs(outdir, exist_ok=True)

for name, size in sizes.items():
    img = Image.new('RGB', (size, size), (13, 8, 6))
    draw = ImageDraw.Draw(img)
    
    # 圆形渐变底
    center = size // 2
    for y in range(size):
        for x in range(size):
            dx, dy = x - center, y - center
            dist = (dx*dx + dy*dy) ** 0.5
            if dist < center * 0.85:
                ratio = dist / (center * 0.85)
                r = int(60 + (180 - 60) * (1 - ratio))
                g = int(30 + (130 - 30) * (1 - ratio))
                b = int(15 + (80 - 15) * (1 - ratio))
                img.putpixel((x, y), (min(255,r), min(255,g), min(255,b)))
    
    # 月亮
    moon_r = size * 0.12
    moon_x, moon_y = center + size*0.15, center - size*0.15
    for dy in range(-int(moon_r), int(moon_r)):
        for dx in range(-int(moon_r), int(moon_r)):
            if dx*dx + dy*dy < moon_r*moon_r:
                px, py = int(moon_x+dx), int(moon_y+dy)
                if 0 <= px < size and 0 <= py < size:
                    bri = int(220 - (dx*dx + dy*dy)**0.5 * 3)
                    img.putpixel((px, py), (min(255,bri), min(255,bri-20), min(255,bri-40)))
    
    # 松树剪影
    tree_x, tree_y = center, int(center * 1.1)
    tree_h = int(size * 0.25)
    for h in range(tree_h):
        for w in range(-2, 3):
            px, py = tree_x + w, tree_y - h
            if 0 <= px < size and 0 <= py < size:
                img.putpixel((px, py), (5, 3, 2))
    
    # 文字（大尺寸才加）
    if size >= 60:
        try:
            font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf', max(10, size//12))
            draw.text((center, int(size*0.75)), "武", fill=(212, 197, 169), font=font, anchor='mm')
        except:
            pass
    
    outpath = os.path.join(outdir, name)
    img.save(outpath)
    print(f"  {name}: {size}x{size}")

print(f"✅ {len(sizes)} 个图标已生成到 {outdir}")
PYEOF