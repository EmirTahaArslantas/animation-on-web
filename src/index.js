import React, { useRef, useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { Canvas, useFrame } from '@react-three/fiber';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { PerspectiveCamera, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

const modelFiles = require.context('./models', false, /\.fbx$/);
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
    const loaders = modelPaths.slice(0, 5).map((path) => {
      return new Promise((resolve, reject) => {
        new FBXLoader().load(path, resolve, undefined, reject);
      });
    });

    Promise.all(loaders)
      .then((fbxModels) => {
        setModels(fbxModels);
      })
      .catch((error) => {
        console.error('Error loading FBX models:', error);
      });
  }, []);

  useEffect(() => {
    let cumulativeXPosition = 0;

    models.forEach((fbx, index) => {
      const mixer = new THREE.AnimationMixer(fbx);
      mixerRefs.current[index] = mixer;

      const randomAction = getRandomAction(fbx.animations);
      if (randomAction) {
        const action = mixer.clipAction(randomAction);
        action.play();
        action.setLoop(THREE.LoopRepeat);
      } else {
        console.warn(`No animations found for model at index ${index}`);
      }

      const box = new THREE.Box3().setFromObject(fbx);
      const size = new THREE.Vector3();
      box.getSize(size);

      const center = new THREE.Vector3();
      box.getCenter(center);
      fbx.position.sub(center);

      fbx.position.x = cumulativeXPosition + size.x / 2;
      fbx.position.y = 0;
      fbx.position.z = 0;

      cumulativeXPosition += size.x + 10; 

      groupRef.current.add(fbx);
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
