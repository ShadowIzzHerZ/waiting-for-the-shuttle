import numpy as np, PIL.Image as I
from skimage.morphology import skeletonize, closing, opening, disk, remove_small_objects
from scipy import ndimage as ndi
im=I.open('lpu.jpg').convert('RGB'); a=np.array(im).astype(int)
dark=(a.max(axis=2)<80)
white=(a.min(axis=2)>225)
# fill white dashes only where surrounded by dark: close dark
m=closing(dark,disk(2))
m=opening(m,disk(2))
m[:, 815:]=False; m[590:, :245]=False; m[:130, 580:815]=False
m=remove_small_objects(m,max_size=150)
I.fromarray(np.where(m[...,None],np.array([255,0,0]),a).astype('uint8')).save('mask3.png')
np.save('m3.npy',m)
