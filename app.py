# app.py (Flask Backend with Python & R syntax validation and Docker sandboxing)
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import uuid
import subprocess
import glob

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = 'static/uploads'
PLOTS_FOLDER = 'static'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(PLOTS_FOLDER, exist_ok=True)

@app.route('/upload-csv', methods=['POST'])
def upload_csv():
    file = request.files['file']
    filename = file.filename
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file.save(filepath)
    return jsonify({'success': True, 'csv_path': filepath.replace("\\", "/")})

@app.route('/list-csv', methods=['GET'])
def list_csv():
    try:
        csv_files = [os.path.basename(f) for f in glob.glob(os.path.join(UPLOAD_FOLDER, '*.csv'))]
        return jsonify({'success': True, 'files': csv_files})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/run-code', methods=['POST'])
def run_code():
    data = request.get_json()
    code = data.get('code', '')
    
    if code.strip() == '':
        return jsonify({'success': False, 'error': "Code cell is empty"}), 400

    language = data.get('language', 'python')
    extension = 'py' if language == 'python' else 'R'
    filename = f"script_{uuid.uuid4().hex}.{extension}"
    script_path = os.path.join(PLOTS_FOLDER, filename)

    # Validate syntax
    if language == 'python':
        try:
            compile(code, '<string>', 'exec')
        except SyntaxError as e:
            return jsonify({'success': False, 'error': f"Python SyntaxError (line {e.lineno}): {e.msg}"}), 400

    elif language == 'r':
        check_cmd = [
            "docker", "run", "--rm",
            "-v", f"{os.path.abspath(PLOTS_FOLDER)}:/app/scripts",
            "r-runner",
            "Rscript", "-e",
            f'tryCatch(parse(file="/app/scripts/{filename}"), error=function(e) stop("R SyntaxError: ", e$message))'
        ]
        try:
            with open(script_path, 'w', encoding='utf-8') as f:
                f.write(code)
            subprocess.run(check_cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        except subprocess.CalledProcessError as e:
            return jsonify({'success': False, 'error': "R syntax error"}), 400
    else:
        return jsonify({'success': False, 'error': "Unsupported language"}), 400

    # Rewrite paths in code and save
    code = code.replace('read_csv("', 'read_csv("/app/static/uploads/')
    with open(script_path, 'w', encoding='utf-8', newline='\n') as f:
        f.write(code)

    try:
        if language == 'python':
            docker_cmd = [
                'docker', 'run', '--rm',
                '--cpus=0.5', '--memory=256m', '--pids-limit=50',
                '-v', f"{os.path.abspath('static')}/uploads:/app/static/uploads",
                '-v', f"{os.path.abspath(PLOTS_FOLDER)}:/app/static",
                '-v', f"{os.path.abspath(PLOTS_FOLDER)}:/app/scripts",
                'python-runner',
                'python3', f"/app/scripts/{filename}"
            ]
        else:
            docker_cmd = [
                'docker', 'run', '--rm',
                '--cpus=0.5', '--memory=256m', '--pids-limit=50',
                '-v', f"{os.path.abspath('static')}/uploads:/app/static/uploads",
                '-v', f"{os.path.abspath(PLOTS_FOLDER)}:/app/static",
                '-v', f"{os.path.abspath(PLOTS_FOLDER)}:/app/scripts",
                'r-runner',
                'Rscript', f"/app/scripts/{filename}"
            ]


        subprocess.run(docker_cmd, check=True, capture_output=True, text=True, timeout=10)

        plot_urls = []
        for i in range(1, 6):
            path = os.path.join(PLOTS_FOLDER, f"plot{i}.html")
            if os.path.exists(path):
                plot_urls.append(f"/static/plot{i}.html")

        return jsonify({'success': True, 'plot_urls': plot_urls}) if plot_urls else \
               jsonify({'success': False, 'error': 'Code provided does not generate any plots.'}), 500

    except subprocess.TimeoutExpired:
        return jsonify({'success': False, 'error': 'Your script timed out.'}), 408
    except subprocess.CalledProcessError as e:
        print("STDOUT:", e.stdout)
        print("STDERR:", e.stderr)
        return jsonify({'success': False, 'error': 'Input file not found or script error.'}), 500
    except FileNotFoundError:
        return jsonify({'success': False, 'error': 'Docker is not running or command not found.'}), 500
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/clear-csv', methods=['DELETE'])
def clear_csv():
    try:
        for f in glob.glob('static/uploads/*.csv'):
            os.remove(f)
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/clear-plots', methods=['DELETE'])
def clear_plots():
    try:
        for f in glob.glob('static/plot*.html'):
            os.remove(f)
        for f in glob.glob('static/script_*'):
            os.remove(f)
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
