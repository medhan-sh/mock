import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import carModelUrl from '../assets/blnk-100_concept_hovering_car.glb'
import './ModelCTA.css'

function ModelCTA({ ctaRef, progressRef, onCreateRoom }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(35, 1, 0.01, 1000)
    const modelGroup = new THREE.Group()
    scene.add(modelGroup)
    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()

    scene.add(new THREE.HemisphereLight(0xbfd9ff, 0x101a34, 2.6))
    const keyLight = new THREE.DirectionalLight(0xffb6e1, 3.5)
    keyLight.position.set(3, 4, 5)
    scene.add(keyLight)

    const resize = () => {
      const { width, height } = canvas.getBoundingClientRect()
      renderer.setSize(width, height, false)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
    }

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(canvas)
    resize()

    let model
    let flightPath
    let cameraDistance
    let frameId
    let disposed = false
    let hovered = false
    const animationStart = performance.now()

    const render = () => {
      const time = (performance.now() - animationStart) / 1000
      const progress = progressRef.current
      const docked = progress >= 0.96

      if (model && flightPath) {
        const point = flightPath.getPoint(progress)
        modelGroup.position.copy(point)
        modelGroup.rotation.set(
          0.12 * Math.sin(progress * Math.PI) * (1 - progress),
          -0.38 * (1 - progress) ** 2,
          -0.55 * (1 - progress) ** 2,
        )
        modelGroup.scale.setScalar(0.68)

        if (docked && hovered) {
          modelGroup.position.y += Math.sin(time * 2.4) * 0.06
          modelGroup.scale.multiplyScalar(1.05)
        }
      }

      canvas.style.pointerEvents = docked ? 'auto' : 'none'

      renderer.render(scene, camera)
      frameId = window.requestAnimationFrame(render)
    }

    const isPointerOverModel = (event) => {
      if (!model || progressRef.current < 0.96) return false

      const bounds = canvas.getBoundingClientRect()
      pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1
      pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1
      raycaster.setFromCamera(pointer, camera)
      return raycaster.intersectObject(model, true).length > 0
    }

    const handlePointerMove = (event) => {
      hovered = isPointerOverModel(event)
      canvas.style.cursor = hovered ? 'pointer' : 'default'
    }

    const handlePointerLeave = () => {
      hovered = false
      canvas.style.cursor = 'default'
    }

    const handleCanvasClick = (event) => {
      if (isPointerOverModel(event)) onCreateRoom()
    }

    canvas.addEventListener('pointermove', handlePointerMove)
    canvas.addEventListener('pointerleave', handlePointerLeave)
    canvas.addEventListener('click', handleCanvasClick)

    new GLTFLoader().load(
      carModelUrl,
      (gltf) => {
        if (disposed) return

        model = gltf.scene
        const bounds = new THREE.Box3().setFromObject(model)
        const size = bounds.getSize(new THREE.Vector3())
        const center = bounds.getCenter(new THREE.Vector3())
        const largestSide = Math.max(size.x, size.y, size.z)

        model.position.sub(center)
        cameraDistance = (largestSide / 2 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) * 1.45
        // Pull the camera back so the docked model is about one-third smaller than its first version.
        camera.position.z = cameraDistance * 2.75
        camera.lookAt(0, 0, 0)
        modelGroup.add(model)
        const rightEdge = largestSide * 4.2
        flightPath = new THREE.CubicBezierCurve3(
          new THREE.Vector3(rightEdge, largestSide * 0.3, -cameraDistance * 1.75),
          new THREE.Vector3(rightEdge * 0.9, largestSide * 0.75, -cameraDistance * 0.8),
          new THREE.Vector3(rightEdge * 0.28, -largestSide * 1.15, -cameraDistance * 0.15),
          new THREE.Vector3(0, -largestSide * 1.4, 0),
        )
      },
      undefined,
      (error) => console.error('Unable to load the Create Room model.', error),
    )

    render()

    return () => {
      disposed = true
      window.cancelAnimationFrame(frameId)
      resizeObserver.disconnect()
      canvas.removeEventListener('pointermove', handlePointerMove)
      canvas.removeEventListener('pointerleave', handlePointerLeave)
      canvas.removeEventListener('click', handleCanvasClick)
      model?.traverse((child) => {
        if (!child.isMesh) return
        child.geometry.dispose()
        const materials = Array.isArray(child.material) ? child.material : [child.material]
        materials.forEach((material) => material.dispose())
      })
      renderer.dispose()
    }
  }, [progressRef])

  const handleLabelClick = () => {
    if (progressRef.current >= 0.96) onCreateRoom()
  }

  return (
    <div className="model-cta" ref={ctaRef}>
      <canvas ref={canvasRef} aria-hidden="true" />
      <button className="model-cta__label" type="button" onClick={handleLabelClick}>
        Create Room
      </button>
    </div>
  )
}

export default ModelCTA
