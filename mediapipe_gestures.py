import cv2
import mediapipe as mp
import socket
import json
import time
import threading

# -------------------------------
# Global frame variable and lock
# -------------------------------
frame_lock = threading.Lock()
global_frame = None
running = True  # flag to stop threads

# -------------------------------
# MediaPipe setup
# -------------------------------
mp_hands = mp.solutions.hands
hands = mp_hands.Hands(max_num_hands=1)
mp_drawing = mp.solutions.drawing_utils

# -------------------------------
# Socket Client Setup
# -------------------------------
HOST = "127.0.0.1"  # Must match Java server host.
PORT = 5005         # Must match Java server port.
sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
sock.connect((HOST, PORT))
print(f"[Socket] Connected to {HOST}:{PORT}")

# -------------------------------
# Camera capture thread function
# -------------------------------
def capture_frames():
    global global_frame, running
    cap = cv2.VideoCapture(0)

    if not cap.isOpened():
        print("Error: Cannot open camera.")
        running = False
        return

    while running:
        ret, frame = cap.read()
        if not ret:
            print("Error: Cannot read from camera.")
            break
        # Flip the frame for mirror view.
        with frame_lock:
            global_frame = cv2.flip(frame, 1)
    cap.release()

# -------------------------------
# Gesture classification function
# -------------------------------
def count_extended_fingers(landmarks):

    extended_fingers = 0
    # For index, middle, ring, and pinky:
    finger_tips = [8, 12, 16, 20]
    finger_pips = [6, 10, 14, 18]
    for tip, pip in zip(finger_tips, finger_pips):
        if landmarks[tip].y < landmarks[pip].y:
            extended_fingers += 1

    # For thumb (assume right hand).
    '''if landmarks[4].x > landmarks[3].x:
        extended_fingers += 1'''

    return extended_fingers

def classify_gesture(landmarks):
    """
  A simple heuristic:
    - If the index fingertip (landmark 8) is lower than the wrist (landmark 0)
      in the image (remember: y increases downward), return "FIST".
    - Otherwise, return "PALM".
  wrist = landmarks[0]
   index_tip = landmarks[8]
   if index_tip.y > wrist.y:
   return "FIST"
   else:
   return "PALM"
   Advanced approach(finger counting)
   Classify gesture based on the number of extended fingers.
    For example:
      - 0 extended fingers: FIST
      - 4 extended fingers: PALM(thumb detection is problematic)
      - Other numbers can map to different gestures.
    """
    count = count_extended_fingers(landmarks)
    if count == 0:
        return "FIST"
    elif count == 4:
        return "PALM"
    else:
        return f"{count}_FINGERS"

# -------------------------------
# Frame processing and sending thread function
# -------------------------------
def process_and_send():
    global global_frame, running
    frame_count = 0
    while running:
        start_time = time.time()
        with frame_lock:
            if global_frame is None:
                continue
            # Copy the current frame to avoid blocking capture thread.
            frame_copy = global_frame.copy()
        # Optionally, process every nth frame to reduce load:
        frame_count += 1
        if frame_count % 600!= 0:
            # Skip processing this frame.
            continue

        # Convert to RGB for MediaPipe.
        rgb_frame = cv2.cvtColor(frame_copy, cv2.COLOR_BGR2RGB)
        result = hands.process(rgb_frame)
        gesture = "UNKNOWN"
        if result.multi_hand_landmarks:
            for handLms in result.multi_hand_landmarks:
                gesture = classify_gesture(handLms.landmark)
                mp_drawing.draw_landmarks(frame_copy, handLms, mp_hands.HAND_CONNECTIONS)
                break  # Process only the first detected hand.

        # Display the processed frame.
        '''cv2.putText(frame_copy, f"Gesture: {gesture}", (10, 30),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
        cv2.imshow("MediaPipe Hand Tracking", frame_copy)
        processing_time = time.time() - start_time
        # Print processing time for debugging.
        print(f"[Processing] Time: {processing_time:.3f}s, Gesture: {gesture}")'''

        # When a valid gesture is detected, send it over the socket.
        if gesture != "UNKNOWN":
            message = json.dumps({"gesture": gesture}) + "\n"  # Newline termination for readLine() on Java.
            try:
                sock.sendall(message.encode('utf-8'))
                print(f"[Socket] Sent: {message.strip()}")
            except Exception as e:
                print("[Socket] Error sending data:", e)
            # Short pause to avoid flooding.
            time.sleep(0.5)

        # Allow a key press to quit.
        if cv2.waitKey(1) & 0xFF == ord('q'):
            running = False
            break

    cv2.destroyAllWindows()
    sock.close()

# -------------------------------
# Start threads
# -------------------------------
capture_thread = threading.Thread(target=capture_frames, daemon=True)
process_thread = threading.Thread(target=process_and_send, daemon=True)

capture_thread.start()
process_thread.start()

# Wait for threads to finish.
capture_thread.join()
process_thread.join()
print("Exiting Python gesture detection.")
