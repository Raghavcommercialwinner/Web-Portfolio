function showSourceCode(projectId) {
    const sourceCode = {
        'lane-detection-code': `
            import cv2
import numpy as np
from tkinter import *
from tkinter import filedialog

# Global variables
prev_left_lane = None
prev_right_lane = None
alpha = 0.1  # Smoothing factor

# Loading YOLOv4 model (pre-trained weights and config)
net = cv2.dnn.readNet("C:\\Users\\Koushik\\Desktop\\kpy\\vpy\\yolov4.weights", "C:\\Users\\Koushik\\Desktop\\kpy\\vpy\\yolov4 (1).cfg")
layer_names = net.getLayerNames()
out_layers = [layer_names[i - 1] for i in net.getUnconnectedOutLayers()]
classes = []
with open("C:\\Users\\Koushik\\Desktop\\kpy\\vpy\\coco.names") as f:
    classes = [line.strip() for line in f.readlines()]

# Initialize Tkinter window
win = Tk()

# output video file name required for displaying the video
pout = ""

# Function to upload and play video
def upload():
    global pout
    ftype = [('Video Files', '*.mp4')]
    fname = filedialog.askopenfilename(filetypes=ftype)

    if fname:

        # Define lane detection function
        def lane_detection(frame):
            global prev_left_lane, prev_right_lane

            # Convert the frame to grayscale
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

            # Apply GaussianBlur to reduce noise
            blurred = cv2.GaussianBlur(gray, (5, 5), 0)

            # Apply Canny edge detection with higher thresholds to capture faint edges
            edges = cv2.Canny(blurred, 50, 200)

            # Define the region of interest (ROI)
            height, width = edges.shape
            mask = np.zeros_like(edges)

            # Create a polygon to focus on the road area (bottom-center part of the frame)
            polygon = np.array([[
                (int(width * 0.1), height),  # left bottom
                (int(width * 0.9), height),  # right bottom
                (int(width * 0.75), int(height * 0.6)),  # right top
                (int(width * 0.25), int(height * 0.6))   # left top
            ]], np.int32)
            
            # Fill the polygon in the mask to create the region of interest
            cv2.fillPoly(mask, polygon, 255)
            masked_edges = cv2.bitwise_and(edges, mask)

            # Use Hough Line Transform to detect lines
            lines = cv2.HoughLinesP(masked_edges, 1, np.pi / 180, threshold=50, minLineLength=100, maxLineGap=180)

            left_lines, right_lines = [], []

            if lines is not None:
                for line in lines:
                    x1, y1, x2, y2 = line[0]
                    slope = (y2 - y1) / (x2 - x1 +1e-6)  # Avoid division by zero

                    # Categorize lines based on slope
                    if slope > 0.2 and slope < 2.5:  # Positive slope (right lane)
                        right_lines.append(line)
                    elif slope < -0.2 and slope > -2.5:  # Negative slope (left lane)
                        left_lines.append(line)

            # Merge lines for left and right lanes and compute their average position
            def merge_lines(lines):
                if len(lines) == 0:
                    return None
                for line in lines:
                    avg_x1 = np.mean(line[0][0])
                    avg_y1 = np.mean(line[0][1])
                    avg_x2 = np.mean(line[0][2])
                    avg_y2 = np.mean(line[0][3])

                return (int(avg_x1), int(avg_y1), int(avg_x2), int(avg_y2))

            # Get the merged lines for left and right lanes
            left_lane = merge_lines(left_lines)
            right_lane = merge_lines(right_lines)

            # Apply smoothing using moving average (exponential smoothing)
            if left_lane is not None:
                if prev_left_lane is None:
                    prev_left_lane = left_lane
                else:
                    prev_left_lane = tuple(np.array(prev_left_lane) * (1 - alpha) + np.array(left_lane) * alpha)

            if right_lane is not None:
                if prev_right_lane is None:
                    prev_right_lane = right_lane
                else:
                    prev_right_lane = tuple(np.array(prev_right_lane) * (1 - alpha) + np.array(right_lane) * alpha)

            # Draw the detected lanes
            if prev_left_lane is not None:
                prev_left_lane = tuple(map(int, prev_left_lane))
                cv2.line(frame, (prev_left_lane[0], prev_left_lane[1]), (prev_left_lane[2], prev_left_lane[3]), (0, 255, 0), 5)

            if prev_right_lane is not None:
                prev_right_lane = tuple(map(int, prev_right_lane))
                cv2.line(frame, (prev_right_lane[0], prev_right_lane[1]), (prev_right_lane[2], prev_right_lane[3]), (0, 255, 0), 5)

            return frame

        # Object detection using YOLOv4
        def detect_objects(frame): 
            height, width = frame.shape[:2]
            blob = cv2.dnn.blobFromImage(frame, 0.00392, (416, 416), (0, 0, 0), True, crop=False)
            net.setInput(blob)
            outputs = net.forward(out_layers)
            boxes, confidences, class_ids = [], [], []
            
            for output in outputs:
                for detection in output:
                    scores = detection[5:]
                    class_id = np.argmax(scores)
                    confidence = scores[class_id]
                    if confidence > 0.5:
                        center_x, center_y, w, h = (detection[:4] * np.array([width, height, width, height])).astype(int)
                        x, y = int(center_x - w / 2), int(center_y - h / 2)
                        boxes.append([x, y, w, h])
                        confidences.append(float(confidence))
                        class_ids.append(class_id)

            indexes = cv2.dnn.NMSBoxes(boxes, confidences, 0.5, 0.4)
            if len(indexes) > 0:
                for i in indexes.flatten():
                    x, y, w, h = boxes[i]
                    label = f"{classes[class_ids[i]]}: {confidences[i]:.2f}"
                    cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 0, 255), 2)
                    cv2.putText(frame, label, (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 2)

            return frame

        # Function to capture frames, process them and display in the video player
        def framecapture():
            vid = cv2.VideoCapture(fname)
            fourcc = cv2.VideoWriter_fourcc(*'XVID')
            out = cv2.VideoWriter(pout, fourcc, 144.0, (640, 480))
            
            while True:
                ret, frame = vid.read()
                if not ret:
                    break
                
                # Apply lane detection to the frame
                lane_frame = lane_detection(frame)

                # Apply object detection to the frame
                output_frame = detect_objects(lane_frame)

                # Write the processed frame to the output video
                out.write(output_frame)

                # Display the processed frame
                cv2.imshow("Lane and Object Detection", output_frame)

                if cv2.waitKey(1) & 0xFF == ord('q'):
                    break

            vid.release()
            out.release()
            cv2.destroyAllWindows()

        # Start frame capture and processing
        framecapture()

# Button to upload video
b1 = Button(win, text='Upload Video', command=upload)
b1.pack()

# Run the Tkinter window loop
win.mainloop()

        `,
        'emotion-recognition-code': `
            from deepface import DeepFace
import cv2
import numpy

cap = cv2.VideoCapture(0)

face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades+'haarcascade_frontalface_default.xml')
     
count=0

while(True):
    ret,frame=cap.read()
    
    pout1=("C:\\Users\\Koushik\\Desktop\\kpy\\images\\img"+str(count)+".jpg")
    
    face=face_cascade.detectMultiScale(frame,scaleFactor=1.3,minNeighbors=5)
    
    for x,y,w,h in face:
        imgrect=cv2.rectangle(frame,(x,y),(x+w,y+h),(0,0,255),1)
        
    img=cv2.imshow('frame',frame)
    
    cv2.imwrite(pout1,frame)
    
    x=cv2.imread(pout1)
    
    analyze=DeepFace.analyze(x,actions=['age','emotion','gender'])
    
    count=count+1
    
    print(analyze[0]['dominant_emotion'],'  ',analyze[0]['dominant_gender'],'  ',analyze[0]['age'])
    
    if cv2.waitKey(1) & 0xFF == ord('q'):
                break
cap.release()
cv2.destroyAllWindows()




        `,
        'voice-chatbot-code': `
            import random
import datetime
import webbrowser
import pyttsx3
import wikipedia
from pygame import mixer
import speech_recognition as sr

engine = pyttsx3.init()
voices = engine.getProperty('voices')
engine.setProperty('voice', voices[1].id)
volume = engine.getProperty('volume')
engine.setProperty('volume', 10.0)
rate = engine.getProperty('rate')
engine.setProperty('rate', rate - 25)

greetings = ['hey there', 'hello', 'hi', 'Hai', 'hey!', 'hey']
question = ['How are you?', 'How are you doing?']
responses = ['Okay', "I'm fine"]
var1 = ['who made you', 'who created you']
var2 = ['I_was_created_by_Edward_right_in_his_computer.', 'Edward', 'Some_guy_whom_i_never_got_to_know.']
var3 = ['what time is it', 'what is the time', 'time']
var4 = ['who are you', 'what is you name']
cmd1 = ['open browser', 'open google']
cmd2 = ['play music', 'play songs', 'play a song', 'open music player']
cmd3 = ['tell a joke', 'tell me a joke', 'say something funny', 'tell something funny']
jokes = ['Can a kangaroo jump higher than a house? Of course, a house doesn’t jump at all.', 'My dog used to chase people on a bike a lot. It got so bad, finally I had to take his bike away.', 'Doctor: Im sorry but you suffer from a terminal illness and have only 10 to live.Patient: What do you mean, 10? 10 what? Months? Weeks?!"Doctor: Nine.']
cmd4 = ['open youtube', 'i want to watch a video']
cmd5 = ['tell me the weather', 'weather', 'what about the weather']
cmd6 = ['exit', 'close', 'goodbye', 'nothing']
cmd7 = ['what is your color', 'what is your colour', 'your color', 'your color?']
colrep = ['Right now its rainbow', 'Right now its transparent', 'Right now its non chromatic']
cmd8 = ['what is you favourite colour', 'what is your favourite color']
cmd9 = ['thank you']
repfr9 = ['youre welcome', 'glad i could help you']

while True:
    now = datetime.datetime.now()
    r = sr.Recognizer()
    with sr.Microphone() as source:
        print("Tell me something:")
        audio = r.listen(source)
        try:
            print("You said:- " + r.recognize_google(audio))
        except sr.UnknownValueError:
            print("Could not understand audio")
            engine.say('I didnt get that. Rerun the code')
            engine.runAndWait()

    if r.recognize_google(audio) in greetings:
       random_greeting = random.choice(greetings)
       print(random_greeting)
       engine.say(random_greeting)
       engine.runAndWait()
    elif r.recognize_google(audio) in question:
       engine.say('I am fine')
       engine.runAndWait()
       print('I am fine')
    elif r.recognize_google(audio) in var1:
       engine.say('I was made by edward')
       engine.runAndWait()
       reply = random.choice(var2)
       print(reply)
    elif r.recognize_google(audio) in cmd9:
       print(random.choice(repfr9))
       engine.say(random.choice(repfr9))
       engine.runAndWait()
    elif r.recognize_google(audio) in cmd7:
       print(random.choice(colrep))
       engine.say(random.choice(colrep))
       engine.runAndWait()
       print('It keeps changing every micro second')
       engine.say('It keeps changing every micro second')
       engine.runAndWait()
    elif r.recognize_google(audio) in cmd8:
       print(random.choice(colrep))
       engine.say(random.choice(colrep))
       engine.runAndWait()
       print('It keeps changing every micro second')
       engine.say('It keeps changing every micro second')
       engine.runAndWait()
    elif r.recognize_google(audio) in cmd2:
       mixer.init()
       mixer.music.load("C:\\Users\Edward Zion SAJI\Downloads\Mighty_God_-_Martin__Colleen_Rebeiro.55145718.wav")
       mixer.music.play()
    elif r.recognize_google(audio) in var4:
       engine.say('I am edza your personal AI assistant')
       engine.runAndWait()
    elif r.recognize_google(audio) in cmd4:
       webbrowser.open('www.youtube.com')
    elif r.recognize_google(audio) in cmd6:
       print('see you later')
       engine.say('see you later')
       engine.runAndWait()
       exit()
    elif r.recognize_google(audio) in cmd5:
       owm = pyowm.OWM('YOUR_API_KEY')
       observation = owm.weather_at_place('Bangalore, IN')
       observation_list = owm.weather_around_coords(12.972442, 77.580643)
       w = observation.get_weather()
       w.get_wind()
       w.get_humidity()
       w.get_temperature('celsius')
       print(w)
       print(w.get_wind())
       print(w.get_humidity())
       print(w.get_temperature('celsius'))
       engine.say(w.get_wind())
       engine.runAndWait()
       engine.say('humidity')
       engine.runAndWait()
       engine.say(w.get_humidity())
       engine.runAndWait()
       engine.say('temperature')
       engine.runAndWait()
       engine.say(w.get_temperature('celsius'))
       engine.runAndWait()
    elif r.recognize_google(audio) in var3:

       print("Current date and time : ")
       print(now.strftime("The time is %H:%M"))
       engine.say(now.strftime("The time is %H:%M"))
       engine.runAndWait()
    elif r.recognize_google(audio) in cmd1:
       webbrowser.open('www.google.com')
    elif r.recognize_google(audio) in cmd3:
       jokrep = random.choice(jokes)
       engine.say(jokrep)
       engine.runAndWait()
    else:
       engine.say("please wait")
       engine.runAndWait()
       print(wikipedia.summary(r.recognize_google(audio)))
       engine.say(wikipedia.summary(r.recognize_google(audio)))
       engine.runAndWait()
       userInput3 = input("or else search in google")
       webbrowser.open_new('www.google.com/search?q=' + userInput3)

        `
    };

    const popup = document.getElementById('popup');
    const sourceCodeElement = document.getElementById('source-code');

    sourceCodeElement.textContent = sourceCode[projectId];
    popup.style.display = 'block';
}

function closePopup() {
    const popup = document.getElementById('popup');
    popup.style.display = 'none';
}
