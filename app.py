from flask import Flask, render_template, request, session, jsonify, redirect, url_for, send_from_directory
from flask_wtf import FlaskForm
from wtforms import FileField, SubmitField
from wtforms.validators import InputRequired
from werkzeug.utils import secure_filename
import os
import cv2
import uuid
from core.detector import detection
from utils.file_handler import handle_upload
from utils.db import init_db, get_job, update_job

init_db()

app = Flask(__name__)  
app.config['SECRET_KEY'] = 'kongesque'  
app.config['UPLOAD_FOLDER'] = 'uploads/videos'  

# Ensure directories exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs('uploads/frames', exist_ok=True)
os.makedirs('uploads/outputs', exist_ok=True)

class UploadFileForm(FlaskForm):
    file = FileField("File", validators=[InputRequired()])
    submit = SubmitField("Run")

# Routes
@app.route('/media/<path:filename>')
def media_file(filename):
    return send_from_directory('uploads', filename)

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
        

    job = get_job(taskID)
    if not job:
         return redirect(url_for('main'))
         
    if job.get('frame_path'):
         return render_template('draw.html', taskID=taskID)
    return redirect(url_for('main'))

@app.route('/submit', methods=['POST'])
def submit():
    taskID = session.get('taskID')
    if not taskID:
        return redirect(url_for('main'))
        
    job = get_job(taskID)
    if not job:
        return redirect(url_for('main'))
    
    # Process the video
    # Note: detection is a generator, so we need to iterate to execute it
    # We can probably optimize this or run it in background in a real app
    # For now, we just consume the generator
    for _ in detection(job['video_path'], job['points'], (job['frame_width'], job['frame_height']), job['color'], taskID):
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
    job = get_job(taskID)
    if not job:
        return jsonify({"message": "Job not found"}), 404

    x, y = data.get('x'), data.get('y')
    points = job['points']
    points.append((x, y))
    update_job(taskID, points=points)
    return jsonify({"message": "Coordinates received successfully"})

@app.route('/color_setting', methods=['POST'])
def color_setting():
    data = request.json
    taskID =  session.get('taskID')
    color = (int(data['b']), int(data['g']), int(data['r']))
    update_job(taskID, color=color)
    return jsonify({"message": "Color settings updated successfully"})



@app.route('/clear', methods=['POST'])
def clear_coordinates():
    taskID = session.get('taskID')
    update_job(taskID, points=[])
    return jsonify({"message": "Coordinates cleared successfully"})
    
if __name__ == "__main__":
    app.run(debug=True) 