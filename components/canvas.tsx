import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
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
  const zoom_factor = 2.0;

  const [mousePos, setMousePos] = useState<Vec2>({x:0,y:0});
  
  const [xImg, setXImg] = useState<HTMLImageElement>(new Image());

  useEffect(() => {
    setXImg(prevXImg => {
      const img = new Image();
      img.src = "/x.svg";
      return img;
    })
  }, [])

  useEffect(() => {
    const canvas = canvas_ref.current;
    if (!canvas) return;
    if (canvas.onclick) return;

    canvas.onmousemove = (e: MouseEvent) => {
      setMousePos(prevMousePos => {
        return {
          x: e.offsetX,
          y: e.offsetY
        }
      })
     // zoom_ctx.drawImage(props.image, 200, 200)
    }
    canvas.onclick = (e: MouseEvent) => {
      const clicked_point: Vec2 = {x: e.offsetX, y: e.offsetY};
      const zone = get_zone({x: canvas.width, y: canvas.height}, clicked_point);
      props.setSelectedArr(prevSelectedArr => {
        const newPoints = [...prevSelectedArr];
        newPoints[zone] = clicked_point;
        return newPoints;
      })
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
      ctx.drawImage(xImg, point.x - image_size / 2, point.y - image_size / 2, image_size, image_size);
    }
  }, [props.selectedArr, xImg])

  return (
    <>
      {(canvas_ref.current && props.image != '') && <div className="pb-3 flex justify-center items-center flex-col">
        <div className="text-sm max-w-40 text-gray-500">{(mousePos.x + mousePos.y == 0) ? "select point to see zoomed preview" : `(${mousePos.x}, ${mousePos.y})`}</div>
        <div className="w-40 h-40 overflow-hidden relative">
          <div className="absolute flex justify-center items-center size-full z-30" >
            <X size={25} />
          </div>
          <img className="absolute z-10" style={{minWidth: `${canvas_ref.current.width * zoom_factor}px`, height: `${canvas_ref.current.height * zoom_factor}px`, top: `${-mousePos.y * zoom_factor + 80}px`, left: `${-mousePos.x * zoom_factor + 80}px`}} src={props.image} alt="" />
        </div>
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