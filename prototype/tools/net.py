# Road network for the cart tracker, traced by hand over map/lpu.jpg (pixel coordinates).
# Run from the prototype folder:  python3 tools/net.py
# Writes map/net.json and map/net_check.jpg (the network drawn over the map), and lists
# any road edge that does not sit on the black road pixels. Edges marked 'p' are short
# links across paved ground where the map does not draw the road as one black line.
# After changing it, paste the new net.json into the DATA.net object in index.html.
import json
import numpy as np
from PIL import Image, ImageDraw
N={
'GATE':(688,561),'G1':(662,540),'M1':(634,524),'M2':(560,485),'M3':(548,477),'M4':(530,457),'M5':(512,445),'M6':(490,439),'M7':(460,427),
'J4':(440,417),'P7':(424,395),'J':(402,367),
'F1':(382,344),'F2':(363,319),'F3':(343,298),'F4':(334,283),
'Q1':(353,293),'Q2':(391,271),'TQ':(394,261),
'K1':(408,358),'K2':(427,346),'K3':(442,336),'K4':(441,327),'K5':(440,320),'K6':(451,313),'K7':(471,301),'K8':(483,292),'K9':(484,284),'K10':(455,266),
'TE':(432,278),'TS':(366,246),
'I1':(350,245),'I2':(296,216),
'C1':(402,229),'HK':(400,217),'HE':(410,222),
'R0':(340,185),'R1':(331,190),'R2':(281,161),'R3':(170,96),'H58':(92,142),'S1':(200,208),
'W1':(432,421),'W2':(390,446),'W3':(486,503),
'L1':(530,514),'L2':(500,528),'L3':(460,552),'L4':(446,564),'L5':(432,582),'L6':(425,593),
'C2':(590,548),'G2':(672,599),
}
chains=[
 'GATE G1 M1 M2 M3 M4 M5 M6 M7 J4 P7 J',
 'J F1 F2 F3 F4','J K1 K2 K3 K4 K5 K6 K7 K8 K9 K10 TE','TE TQ TS','TS I1 I2',
 'HE HK R0 R1 R2 R3 H58','R2 S1 H58',
 'J4 W1 W2 W3','M2 L1 L2 L3 L4 L5 L6','L1 C2 G2','C2 M1']
paved=['F3 Q1 Q2 TQ','HK C1 TS','W3 L2']
E=[]
for c in chains:
    k=c.split(); E+= [[a,b] for a,b in zip(k,k[1:])]
for c in paved:
    k=c.split(); E+= [[a,b,'p'] for a,b in zip(k,k[1:])]
json.dump({'N':{k:list(v) for k,v in N.items()},'E':E},open('map/net.json','w'))
a=np.asarray(Image.open('map/lpu.jpg').convert('RGB')).astype(int)
dark=a.max(axis=2)<95
for e in E:
    p,q=np.array(N[e[0]]),np.array(N[e[1]]); n=int(np.hypot(*(q-p)))+1; ok=0
    for i in range(n+1):
        x,y=(p+(q-p)*i/n).round().astype(int)
        if dark[y-3:y+4,x-3:x+4].any(): ok+=1
    f=ok/(n+1)
    if f<0.8: print(e,round(f,2))
im=Image.open('map/lpu.jpg').convert('RGB').crop((0,0,820,744)); im=im.resize((im.width*3,im.height*3)); d=ImageDraw.Draw(im)
for e in E: d.line([(N[e[0]][0]*3,N[e[0]][1]*3),(N[e[1]][0]*3,N[e[1]][1]*3)],fill=(0,255,255) if len(e)>2 else (255,0,255),width=3)
for k,(x,y) in N.items(): d.ellipse([x*3-4,y*3-4,x*3+4,y*3+4],fill=(0,90,255)); d.text((x*3+6,y*3-12),k,fill=(255,255,0),stroke_width=2,stroke_fill=(0,0,0))
im.save('map/net_check.jpg',quality=82)
