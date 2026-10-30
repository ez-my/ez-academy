Local portrait processing assets

MediaPipe Tasks Vision 1.1.1, Apache-2.0: https://github.com/google-ai-edge/mediapipe
Selfie Segmenter model, float16 version 1, downloaded from:
https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/1/selfie_segmenter.tflite
Model documentation: https://ai.google.dev/edge/mediapipe/solutions/vision/image_segmenter

All runtime and model requests use this app's own origin. Portraits are processed in a worker and never sent to an API. The original is not persisted. A cropped portrait and avatar are saved in IndexedDB, keyed by the signed-in account, up to 1 MB combined. Clearing site data clears them. Build with npm run build:photo-tools after changing the worker.
