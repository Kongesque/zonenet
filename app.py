from flask import Flask, render_template, request, session, jsonify, redirect, url_for
from flask_wtf import FlaskForm
from wtforms import FileField, SubmitField
from wtforms.validators import InputRequired
from werkzeug.utils import secure_filename
import os
import cv2
import uuid
from core.detector import detection
from utils.file_handler import handle_upload

app = Flask(__name__)  
app.config['SECRET_KEY'] = 'kongesque'  
app.config['UPLOAD_FOLDER'] = 'static/files/input'  
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs('static/files/frame', exist_ok=True) # Ensure this exists too

class UploadFileForm(FlaskForm):
    file = FileField("File", validators=[InputRequired()])
    submit = SubmitField("Run")

# Routes
@app.route('/', methods=['GET', 'POST'])
def main():
    form = UploadFileForm()
    if request.method == 'POST' and form.validate_on_submit():
        handle_upload(form.file.data, app.config['UPLOAD_FOLDER'])
        return redirect(url_for('draw'))
    return render_template('main.html', form=form)
    
@app.route('/draw', methods=['GET', 'POST'])
def draw():
    taskID = session.get('taskID')
    if not taskID:
        return redirect(url_for('main'))
        
    points_key = 'points_' + taskID
    if points_key not in session:
        session[points_key] = []
        
    color_key = 'color_' + taskID
    if color_key not in session:
        session[color_key] = (5, 189, 251)
        
    video_path_key = 'video_path_' + taskID

    if video_path_key in session:
        return render_template('draw.html', taskID=taskID)
    return redirect(url_for('main'))

@app.route('/submit', methods=['POST'])
def submit():
    taskID = session.get('taskID')
    if not taskID:
        return redirect(url_for('main'))
        
    video_path_key = 'video_path_' + taskID
    frame_size_key = 'frame_size_' + taskID
    color_key = 'color_' + taskID
    points_key = 'points_' + taskID
    
    # Process the video
    # Note: detection is a generator, so we need to iterate to execute it
    # We can probably optimize this or run it in background in a real app
    # For now, we just consume the generator
    for _ in detection(session.get(video_path_key), session.get(points_key), session.get(frame_size_key), session.get(color_key), taskID):
        pass
        
    return redirect(url_for('result'))

@app.route('/result', methods=['GET', 'POST']) 
def result():
    taskID = session.get('taskID')
    if not taskID:
        return redirect(url_for('main'))
        
    form = UploadFileForm()
    if request.method == 'POST' and form.validate_on_submit():
        handle_upload(form.file.data, app.config['UPLOAD_FOLDER'])
        return redirect(url_for('draw'))
    return render_template('result.html', form=form, taskID=taskID)


@app.route('/get_coordinates', methods=['POST'])
def get_coordinates():
    data = request.get_json()
    taskID =  session.get('taskID')
    taskID =  session.get('taskID')
    x, y = data.get('x'), data.get('y')

    points_key = 'points_' + taskID
    points = session.get(points_key, [])
    points.append((x, y))
    session[points_key] = points
    return jsonify({"message": "Coordinates received successfully"})

@app.route('/color_setting', methods=['POST'])
def color_setting():
    data = request.json
    taskID =  session.get('taskID')
    color_key = 'color_' + taskID
    color = (int(data['b']), int(data['g']), int(data['r']))
    session[color_key] = color
    return jsonify({"message": "Color settings updated successfully"})



@app.route('/clear', methods=['POST'])
def clear_coordinates():
    taskID = session.get('taskID')
    points_key = 'points_' + taskID
    session[points_key] = []
    return jsonify({"message": "Coordinates cleared successfully"})
    
if __name__ == "__main__":
    app.run(debug=True) 