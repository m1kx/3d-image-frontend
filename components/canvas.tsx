"use client"

import { cn } from "@/lib/utils";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import { Slider } from "./ui/slider";
import X from "./x";

export type Vec2 = {
  x: number;
  y: number;
}

export type CanvasProps = {
  size: Vec2;
  image: string | undefined;
  selectedArr: Vec2[];
  setSelectedArr: Dispatch<SetStateAction<Vec2[]>>;
}

const get_zone = (size: Vec2, point: Vec2) => {
  return (point.x < size.x / 3) ? 0 : (point.x < (size.x / 3) * 2) ? 1 : 2;
}

export function Canvas(props: CanvasProps) {

  const canvas_ref = useRef<HTMLCanvasElement>(null);
  const preview_window_ref = useRef<HTMLDivElement>(null);
  const [zoomFactor, setZoomFactor] = useState<number>(1.0);

  const [mousePos, setMousePos] = useState<Vec2>({x:60,y:60});
  const [touchStartPos, setTouchStartPos] = useState<Vec2>({x:-1,y:-1});

  const click = (clicked_point: Vec2, canvas: HTMLCanvasElement) => {
    const zone = get_zone({x: canvas.width * 4, y: canvas.height * 4}, clicked_point);
    props.setSelectedArr(prevSelectedArr => {
      const newPoints = [...prevSelectedArr];
      newPoints[zone] = clicked_point;
      return newPoints;
    })
  }

  useEffect(() => {
    const canvas = canvas_ref.current;
    if (!canvas) return;
    if (canvas.onclick) return;

    canvas.onmousemove = (e: MouseEvent) => {
      setMousePos(prevMousePos => {
        return {
          x: e.offsetX * 4,
          y: e.offsetY * 4
        }
      })
     // zoom_ctx.drawImage(props.image, 200, 200)
    }
    canvas.onclick = (e: MouseEvent) => {
      const clicked_point: Vec2 = {x: e.offsetX * 4, y: e.offsetY * 4};
      click(clicked_point, canvas)
    }
  }, [props, props.selectedArr])

  useEffect(() => {
    const canvas = canvas_ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    for (const point of props.selectedArr) {
      if (point.x == -1 || point.y == -1) continue;
      const image_size = 25;
      ctx.beginPath();
      ctx.moveTo(point.x / 4 - image_size / 4, point.y / 4 - image_size / 4);
      ctx.lineTo(point.x / 4 + image_size / 4, point.y / 4 - image_size / 4);
      ctx.lineTo(point.x / 4, point.y / 4);
      ctx.fillStyle = '#ff0002';
      ctx.fill();
    }
  }, [props.selectedArr])

  const touch_start = (event: any) => {
    if (!preview_window_ref || !preview_window_ref.current) return;
    const touch_location = event.targetTouches[0];
    console.log(touch_location.pageX)
    setTouchStartPos({
      x: touch_location.pageX,
      y: touch_location.pageY
    })
  }

  const touch_move = (event: any) => {
    const touch_location = event.targetTouches[0]; 
    setMousePos(prevMousePos => {
      return {
        x: prevMousePos.x + (touchStartPos.x - touch_location.pageX) * 0.3,
        y: prevMousePos.y + (touchStartPos.y - touch_location.pageY) * 0.3
      }
    })
    setTouchStartPos({
      x: touch_location.pageX,
      y: touch_location.pageY
    })
  }

  return (
    <>
      {(canvas_ref.current && props.image != '') && <div className="pb-3 flex justify-center items-center flex-col">
        Preview Zoom Factor: <b>{zoomFactor}</b>
        <Slider defaultValue={[1]}
          max={15}
          min={0.25}
          step={0.05}
          className={cn("w-[100%] p-4")}
          onValueChange={(value: number[]) => {setZoomFactor(value[0])}}
        />
        <div className="text-sm max-w-40 text-gray-500 p-1">{(mousePos.x + mousePos.y == 0) ? "select point to see zoomed preview" : `(${mousePos.x.toFixed(0)}, ${mousePos.y.toFixed(0)})`}</div>
        <div className="w-60 h-60 overflow-hidden relative rounded-md touch-none" ref={preview_window_ref} onTouchStart={touch_start} onTouchMove={touch_move}>
          <div className="absolute flex justify-center items-center size-full z-30" >
            <X size={25} />
          </div>
          <img className="absolute z-10" style={{minWidth: `${props.size.x * 4 * zoomFactor}px`, height: `${props.size.y * 4 * zoomFactor}px`, top: `${(-mousePos.y * zoomFactor + 120).toFixed(0)}px`, left: `${(-mousePos.x * zoomFactor + 120).toFixed(0)}px`}} src={props.image} alt="" />
        </div>
        {touchStartPos.x != -1 && <Button className="m-2 w-60" onClick={() => click({x: Math.round(mousePos.x), y: Math.round(mousePos.y)}, canvas_ref.current as HTMLCanvasElement)}>SET POINT</Button>}
      </div>}
      {props.size.x != 0 &&
      <div className="grid grid-cols-3 w-full">
        {props.selectedArr.map((value, index) => {
          return <div className="text-sm text-center pb-2" key={index}>
            {(value.x == -1 || value.y == -1) ? <div className="text-red-900">not selected</div> : <div className="text-green-900">({value.x}, {value.y})</div>}
          </div>
          })}
      </div>
      }
      <canvas className="absolute" width={props.size.x} height={props.size.y} ref={canvas_ref}></canvas>
    </>
  )
}