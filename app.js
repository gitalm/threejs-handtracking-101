<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DNA Hand Tracking</title>
  <style>
    body {
      margin: 0;
      overflow: hidden;
      background-color: #111;
    }
    canvas {
      display: block;
    }
    #info {
      position: absolute;
      top: 10px;
      width: 100%;
      text-align: center;
      color: white;
      font-family: Arial, sans-serif;
      pointer-events: none;
    }
  </style>
</head>
<body>
  <div id="info">DNA Hand Tracking - Nutze deine Hände, um die DNA zu drehen und zu skalieren</div>
  <script src="https://cdn.jsdelivr.net/npm/three@0.132.2/build/three.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/three@0.132.2/examples/js/loaders/GLTFLoader.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/@mediapipe/hands"></script>
  <script>
    // Three.js Szene einrichten
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);

    // Licht hinzufügen
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(1, 1, 1);
    scene.add(light);
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    // DNA-Modell laden
    const loader = new THREE.GLTFLoader();
    let dnaModel;

    loader.load(
      'models/dna.gltf', // Pfad zu deinem DNA-Modell
      (gltf) => {
        dnaModel = gltf.scene;
        dnaModel.scale.set(0.5, 0.5, 0.5); // Skalierung anpassen
        scene.add(dnaModel);
      },
      undefined,
      (error) => {
        console.error('Fehler beim Laden des DNA-Modells:', error);
      }
    );

    // MediaPipe Hands initialisieren
    const hands = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });

    hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    // Kamera für Handtracking
    const videoElement = document.createElement('video');
    videoElement.style.display = 'none';
    document.body.appendChild(videoElement);

    // Handtracking-Logik
    hands.onResults((results) => {
      if (dnaModel && results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];

        // DNA drehen basierend auf Indexfinger-Position
        const indexFingerTip = landmarks[8];
        dnaModel.rotation.y = indexFingerTip.x * Math.PI;

        // DNA skalieren basierend auf Daumen- und Zeigefinger-Abstand (Pinch-Geste)
        const thumbTip = landmarks[4];
        const distance = Math.sqrt(
          Math.pow(thumbTip.x - indexFingerTip.x, 2) +
          Math.pow(thumbTip.y - indexFingerTip.y, 2)
        );
        dnaModel.scale.set(0.5 * (1 + distance), 0.5 * (1 + distance), 0.5 * (1 + distance));
      }
    });

    // Kamera starten
    const cameraParams = new Camera(videoElement, {
      onFrame: async () => {
        await hands.send({ image: videoElement });
      },
      width: 640,
      height: 480
    });
    cameraParams.start();

    // Animation und Rendering
    function animate() {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    }
    animate();

    // Fenstergröße anpassen
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
  </script>
</body>
</html>
