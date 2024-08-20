import React, { useRef, useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { Canvas, useFrame } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { PerspectiveCamera, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

// GLTF dosyalarınızı yüklemek için require.context kullanabilirsiniz.
const modelFiles = require.context('./models', false, /\.(gltf|glb)$/);
const modelPaths = modelFiles.keys().map(modelFiles);

function getRandomAction(animations) {
  if (animations.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * animations.length);
  return animations[randomIndex];
}

function Scene() {
  const [models, setModels] = useState([]);
  const groupRef = useRef();
  const mixerRefs = useRef([]);

  useEffect(() => {
    const loaders = modelPaths.slice(0, 1).map((path) => {
      return new Promise((resolve, reject) => {
        new GLTFLoader().load(path, resolve, undefined, reject);
      });
    });

    Promise.all(loaders)
      .then((gltfModels) => {
        setModels(gltfModels.map(gltf => gltf.scene));
      })
      .catch((error) => {
        console.error('Error loading GLTF models:', error);
      });
  }, []);

  useEffect(() => {
    let cumulativeXPosition = 0;

    models.forEach((model, index) => {
      const mixer = new THREE.AnimationMixer(model);
      mixerRefs.current[index] = mixer;

      const randomAction = getRandomAction(model.animations);
      if (randomAction) {
        const action = mixer.clipAction(randomAction);
        action.play();
        action.setLoop(THREE.LoopRepeat);
      } else {
        console.warn(`No animations found for model at index ${index}`);
      }

      const box = new THREE.Box3().setFromObject(model);
      const size = new THREE.Vector3();
      box.getSize(size);

      const center = new THREE.Vector3();
      box.getCenter(center);
      model.position.sub(center);

      model.position.x = cumulativeXPosition + size.x / 2;
      model.position.y = 0;
      model.position.z = 0;

      cumulativeXPosition += size.x + 10;

      groupRef.current.add(model);
    });

    return () => {
      mixerRefs.current = [];
    };
  }, [models]);

  useFrame((state, delta) => {
    mixerRefs.current.forEach((mixer) => mixer.update(delta));
  });

  return (
    <>
      <group ref={groupRef} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 20, 15]} intensity={1} />
      <PerspectiveCamera makeDefault position={[100, 500, 1500]} />
      <OrbitControls />
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Canvas>
      <Scene />
    </Canvas>
  </React.StrictMode>
);
