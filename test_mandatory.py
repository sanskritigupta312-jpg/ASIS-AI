import cv2
import numpy as np
import sys
sys.path.insert(0, 'src/backend')

# Create a minimal 2-room floor plan image
img = np.ones((200, 300, 3), dtype=np.uint8) * 255
cv2.rectangle(img, (10,10), (290,190), (0,0,0), 3)   # outer wall
cv2.line(img, (150,10), (150,190), (0,0,0), 3)        # one divider = 2 rooms
cv2.imwrite('test_minimal.png', img)

from process_floor import analyse
result = analyse('test_minimal.png', 'src/backend/outputs/test_minimal.obj')
import os; os.remove('test_minimal.png')

labels = [r['label'] for r in result['rooms']]
print("Rooms:", labels)
for must in ['Bedroom','Kitchen','Bathroom']:
    print(f"  {must}: {'✓' if must in labels else '✗ MISSING'}")
