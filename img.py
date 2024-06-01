import cv2
import sys
import numpy as np

def get_post(img_s):
    img = cv2.imread(img_s)
    blu = cv2.GaussianBlur(img, (5, 5), 0, 0)
    canny = cv2.Canny(blu, 0, 100)
    contours, hierarchy = cv2.findContours(canny, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    print(len(contours))
    for i in contours:
        x, y, w, h = cv2.boundingRect(i)
        area = cv2.contourArea(i)
        zhouzhang = cv2.arcLength(i, True)
        if 5025 < area < 7225 and 300 < zhouzhang < 380:
            x, y, w, h = cv2.boundingRect(i)
            cv2.rectangle(img, (x, y), (x + w, y + h), (0, 0, 225), 2)
            cv2.imwrite('./picture/img_122.png', img)
            return x
    return 0

if __name__ == "__main__":
    img_path = sys.argv[1]
    result = get_post(img_path)
    print(result)
