# Starting a new Forge-based Web Application

## Installing Requirements
- `virtualenv -p python3.7 venv`
- `. venv/bin/activate`
- `pip install -r requirements.txt`
- `npm i`

## Create a Forge App
- Create a new app at `forge.autodesk.com` and note the Client ID and Client Secret

## Translate a Model
- Add a Revit model to the `app/forge` directory
- Make `app/forge` your current directory and run `python forge_model_uploader.py -b -j model_uploader.json`
- Note the resulting URN of the form: `dXJuOm...`

## Running Locally
- In `routes.py` replace '[MODEL_ID]' with the URN from above
- Locally run your web server: `flask run`
- Navigating in your browser to `http://127.0.0.1:5000/` you should now see your project

## Loading the Configurator
- 