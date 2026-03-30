import cv2
import numpy as np
img = np.ones((400,600,3), np.uint8) * 255
cv2.rectangle(img, (50,50), (550,350), (0,0,0), 4)
cv2.line(img, (50,200), (550,200), (0,0,0), 4)
cv2.line(img, (300,50), (300,350), (0,0,0), 4)
cv2.imwrite('test_floor.png', img)
