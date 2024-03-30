'use client';

import ArrowDown from '@/components/arrdown';
import { Canvas } from '@/components/canvas';
import LoadingSpinner from '@/components/loading-spinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import { ChangeEvent, useEffect, useRef, useState } from 'react';

type Vec2 = {
  x: number;
  y: number;
};

const file_upload = (e: ChangeEvent<HTMLInputElement>) => {
  const img_size: Vec2 = {
    x: 0,
    y: 0,
  };
  const form_data: FormData = new FormData();
  const reader: FileReader = new FileReader();

  const input: HTMLInputElement = e.target;
  console.log(input.files);
  if (!input.files) {
    // ERR
    return {
      form_data,
      img_size,
      reader,
    };
  }
  const file: File = input.files[0];
  if (!file) {
    // ERR
    return {
      form_data,
      img_size,
      reader,
    };
  }

  reader.readAsDataURL(file);
  form_data.append('image', file);

  return {
    form_data,
    img_size,
    reader,
  };
};

const download_gif = (url: string) => {
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = 'result.gif';
  document.body.appendChild(a);
  a.click();
};

const get_zone = (size: Vec2, point: Vec2) => {
  return point.x < size.x / 3 ? 0 : point.x < (size.x / 3) * 2 ? 1 : 2;
};

export default function Home() {
  let [event, setEvent] = useState<ChangeEvent<HTMLInputElement>>();
  let [previewImageSrc, setPreviewImageSrc] = useState<string>('');
  let [loading, setLoading] = useState(false);
  let [imageSize, setImageSize] = useState<Vec2>({ x: 0, y: 0 });
  let [originalImageSize, setOriginalImageSize] = useState<Vec2>({
    x: 0,
    y: 0,
  });
  let [selectedArr, setSelectedArr] = useState<Vec2[]>([
    { x: -1, y: -1 },
    { x: -1, y: -1 },
    { x: -1, y: -1 },
  ]);
  let [formData, setFormData] = useState<FormData>();

  let [resultGif, setResultGif] = useState<string>('');
  let [loadingResultGif, setLoadingResultGif] = useState<boolean | null>(null);

  const image_ref = useRef<HTMLImageElement>(null);

  const update_canvas_size = () => {
    setImageSize({
      x: image_ref.current ? image_ref.current.width : 0,
      y: image_ref.current ? image_ref.current.height : 0,
    });
  };

  useEffect(() => {
    window.addEventListener('resize', update_canvas_size);
    return () => window.removeEventListener('resize', update_canvas_size);
  }, []);

  useEffect(() => {
    if (!event) return;
    setLoading(true);
    const { form_data, img_size, reader } = file_upload(event);

    setFormData(form_data);

    reader.onload = (e: ProgressEvent<FileReader>) => {
      setLoading(false);
      if (!image_ref || !image_ref.current) return;

      /*const img_temp = new HTMLImageElement();
      img_temp.onload = () => {
        setOriginalImageSize({
          x: img_temp.width,
          y: img_temp.height
        });
      }
      img_temp.src = reader.result as string;*/

      image_ref.current.onload = () => {
        setOriginalImageSize({
          x: image_ref.current ? image_ref.current.naturalWidth : 0,
          y: image_ref.current ? image_ref.current.naturalHeight : 0,
        });
        setImageSize({
          x: image_ref.current ? image_ref.current.width : 0,
          y: image_ref.current ? image_ref.current.height : 0,
        });
      };
      if (previewImageSrc != '') {
        setSelectedArr([
          { x: -1, y: -1 },
          { x: -1, y: -1 },
          { x: -1, y: -1 },
        ]);
      }
      setPreviewImageSrc(reader.result as string);
    };
  }, [event]);

  const run = () => {
    setLoadingResultGif((prev) => {
      return true;
    });
    const img_points = selectedArr.map((point, index) => {
      const zone = index;
      return {
        x: Math.round(
          (point.x / (imageSize.x * 4)) * originalImageSize.x -
            (originalImageSize.x / 3) * zone,
        ),
        y: Math.round((point.y / (imageSize.y * 4)) * originalImageSize.y),
      };
    });
    const send_data = {
      points: img_points,
    };
    for (const item in send_data) {
      // @ts-ignore
      formData?.append(item, JSON.stringify(send_data[item]));
    }
    fetch('https://images.mikaco.de/api/gif', {
      method: 'POST',
      body: formData,
    })
      .then((res) => res.blob())
      .then((data) => {
        const url = URL.createObjectURL(data);
        setResultGif(url);
        setLoadingResultGif((prev) => {
          return false;
        });
      })
      .then(() => {
        console.log(resultGif);
      });
  };

  if (loadingResultGif != null && loadingResultGif)
    return (
      <div className="flex h-dvh w-dvw flex-col items-center justify-center">
        <p className="p-5 text-center">
          Creating gif...
          <br />
          This will take up to 20 seconds!
        </p>
        <LoadingSpinner />
      </div>
    );
  if (resultGif != '')
    return (
      <div className="flex h-dvh w-dvw flex-col items-center justify-center">
        <img className="h-full" alt="x" src={resultGif}></img>
        <div className="absolute bottom-0 w-full p-3">
          <Button onClick={() => download_gif(resultGif)} className="w-full">
            DOWNLOAD
          </Button>
        </div>
      </div>
    );

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-5">
      <div className="w-auto">
        {!loading && previewImageSrc == '' && (
          <>
            <Input type="file" onChange={(e) => setEvent(e)} />
            <div className="flex justify-center p-10 text-center text-gray-400">
              <p className="max-w-80">
                Convert your 3d images to gifs without time-consuming offsetting
                in photoshop!
                <br />
                <br />
                Get started by uploading the source image
              </p>
            </div>
            <div className="flex flex-col items-center justify-center text-gray-500">
              <div className="p-2">Example:</div>
              <Image
                width={500}
                height={100}
                alt="plants"
                src={'/plants.jpg'}
              ></Image>
              <div className="p-5 opacity-30">
                <ArrowDown size={50} />
              </div>
              <Image
                width={150}
                height={100}
                alt="plants"
                src={'/plants.gif'}
              ></Image>
            </div>
          </>
        )}
      </div>
      {loading && (
        <div className="flex h-dvh w-dvw flex-col items-center justify-center">
          <p className="p-5">Loading Image</p>
          <LoadingSpinner />
        </div>
      )}
      <div className="relative flex flex-col items-center pb-2 pl-5 pr-5 pt-5">
        <div className="max-w-3xl">
          <Canvas
            size={imageSize}
            image={previewImageSrc}
            selectedArr={selectedArr}
            setSelectedArr={setSelectedArr}
          />
          <img
            hidden={!previewImageSrc}
            ref={image_ref}
            src={previewImageSrc}
            alt=""
          />
          <div
            hidden={!previewImageSrc}
            className="w-full pt-4 text-center text-xs text-gray-600	"
          >
            Tipp:
            <br /> <b>on pc</b> - use arrow keys and enter to move around and
            set points.
            <br /> <b>on mobile</b> - swipe in the preview image above to set
            points
          </div>
        </div>
      </div>
      {selectedArr.filter((elem) => elem.x != -1).length == 3 && (
        <div className="w-full max-w-3xl pl-5 pr-5 pt-2">
          <Button className="w-full" onClick={() => run()}>
            CREATE GIF
          </Button>
        </div>
      )}
    </main>
  );
}
