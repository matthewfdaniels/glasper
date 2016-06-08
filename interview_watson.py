from multiprocessing import Process
from watson import *
import os
from settings import CREDS
import requests


'''I tried my hand at a couple different python libraries for slicing audio,
but I ended up having to do it by hand in Ableton'''

'''Huge thanks to Dan Nguyen @ Stanford for figuring out basic Watson stuff
https://github.com/dannguyen/watson-word-watcher'''


API_ENDPOINT = 'https://stream.watsonplatform.net/speech-to-text/api/v1/recognize'
API_DEFAULT_PARAMS = {
    'continuous': True,
    'timestamps': True,
    'word_confidence': True,
    'profanity_filter': False,
    'word_alternatives_threshold': 0.4
}

API_DEFAULT_HEADERS = {
    'content-type': 'audio/wav'
}


def speech_to_text_api_call(audio_filename, username, password):
    with open(audio_filename, 'rb') as a_file:
        http_response = requests.post(API_ENDPOINT,
                                      auth=(username, password),
                                      data=a_file,
                                      params=API_DEFAULT_PARAMS,
                                      headers=API_DEFAULT_HEADERS,
                                      stream=False)
        return http_response


def transcribe_audio():
    # Send each audio segment in a project to Watson Speech-to-Text API
    # with the POWER OF MULTITHREADED PRPOCESSINGASDF!!
    #
    # returns nothing...just prints to screen
    segments = os.listdir('segments')
    watson_jobs = []
    fns = ['segments/' + fn for fn in segments]
    for file in fns:
        transcript_fn = file.split('.wav')[0] + '.json'
        print("Sending to Watson API:\n\t", file)
        job = Process(target=process_transcript_call,
                      args=(file, transcript_fn, CREDS))
        job.start()
        watson_jobs.append(job)
    # Wait for all jobs to end
    for job in watson_jobs:
        job.join()


def process_transcript_call(audio_filename, transcript_path, creds):
    resp = speech_to_text_api_call(
        audio_filename,
        username=creds['username'],
        password=creds['password'])
    with open(transcript_path, 'w') as t:
        t.write(resp.text)
        print("Transcribed:\n\t", transcript_path)

transcribe_audio()
