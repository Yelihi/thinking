

import { useEffect, useState } from 'react';
import { Canvas, useFrame, useGraph } from '@react-three/fiber';
import { Color, Euler, Matrix4 } from 'three';
import './App.css';
import { useGLTF } from '@react-three/drei';
import { FilesetResolver, FaceLandmarker, Category } from '@mediapipe/tasks-vision';

import type { SkinnedMesh } from 'three';

let video: HTMLVideoElement;
let faceLandmarker: FaceLandmarker;
let lastVideoTime = -1;
let headMesh: SkinnedMesh;


let rotation: Euler = new Euler();
let blendshapes: Category[] = [];

function App() {
  const [url, setUrl] = useState("https://models.readyplayer.me/69bbe6984d98c76821450c05.glb")

  const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value)
  }

  const setup = async () => {
    const vision = await FilesetResolver.forVisionTasks(
      // path/to/wasm/root
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );
    faceLandmarker = await FaceLandmarker.createFromOptions(
      vision,
      {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
          delegate: "GPU"
        },
        outputFaceBlendshapes: true,
        outputFacialTransformationMatrixes: true,
        runningMode: "VIDEO"
      });


    video = document.getElementById('video') as HTMLVideoElement;
    // camera 허가
    navigator.mediaDevices.getUserMedia({
      video: { width: 1280, height: 720 }
    }).then((stream) => {
      video.srcObject = stream;
      video.addEventListener('loadeddata', predict)
    })
  }

  const predict = () => {
    if (video && video.videoWidth > 0 && video.videoHeight > 0) {
      const nowInMs = Date.now();

      if (lastVideoTime !== video.currentTime) {
        lastVideoTime = video.currentTime;
        const result = faceLandmarker.detectForVideo(video, nowInMs);
        if (result.facialTransformationMatrixes && result.facialTransformationMatrixes.length > 0 && result.faceBlendshapes && result.faceBlendshapes.length > 0) {
          const matrix = new Matrix4().fromArray(result.facialTransformationMatrixes[0].data);
          rotation = new Euler().setFromRotationMatrix(matrix);

          blendshapes = result.faceBlendshapes[0].categories
        }
      }
    }

    requestAnimationFrame(predict);
  }

  useEffect(() => {
    setup();
  }, [])



  return (
    <div className="App">
      <input type="text" placeholder='avartar url' onChange={handleOnChange} />
      <video autoPlay id="video" />
      <Canvas style={{ height: 400 }} camera={{ fov: 25 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[1, 1, 1]} color={new Color(1, 0, 0)} intensity={0.5} />
        <pointLight position={[-1, 0, 1]} color={new Color(0, 1, 0)} intensity={0.5} />
        <Avatar url={url} />
      </Canvas>
    </div>
  );
}

function Avatar(params: { url: string }) {
  const avatar = useGLTF(`${params.url}?morphTargets=ARKit&textureAtlas=1024`)
  const { nodes } = useGraph(avatar.scene)


  useEffect(() => {
    headMesh = nodes.Wolf3D_Avatar as SkinnedMesh
  }, [nodes])

  useFrame((_, delta) => {
    if (headMesh !== null) {
      blendshapes.forEach((blendshape) => {
        let index = headMesh.morphTargetDictionary![blendshape.categoryName];

        if (index >= 0) {
          headMesh.morphTargetInfluences![index] = blendshape.score;
        }
      })
    }

    nodes.Head.rotation.set(rotation.x / 3, rotation.y / 3, rotation.z / 3);
    nodes.Neck.rotation.set(rotation.x / 3, rotation.y / 3, rotation.z / 3);
    nodes.Spine1.rotation.set(rotation.x / 3, rotation.y / 3, rotation.z / 3);
  })





  return <primitive object={avatar.scene} position={[0, -2.2, 4]} scale={1.3} />
}

export default App;
