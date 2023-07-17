import { useState, useRef, useEffect } from 'react';
import Button from '@mui/material/Button';
import Slider from '@mui/material/Slider';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import Typography from '@mui/material/Typography';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

const Editor = () => {
  const canvasRef = useRef(null);
  const [brushSize, setBrushSize] = useState(10);
  const [imageData, setImageData] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [originalImageData, setOriginalImageData] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [erase, setErase] = useState(false);

  const [scale, setScale] = useState(1);
  const [worldX, setWorldX] = useState(0);
  const [worldY, setWorldY] = useState(0);
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);
  const [mouseRX, setMouseRX] = useState(0);
  const [mouseRY, setMouseRY] = useState(0);
  const [mouseButton, setMouseButton] = useState(0);

  useEffect(() => {

    // const cursorSmall = document.getElementById('cursor-image');
    const canvasParentContainer = document.getElementById('canvas-container');
    const canvas = canvasRef.current;

    canvas.width = canvasParentContainer.clientWidth;
    canvas.height = canvasParentContainer.clientHeight;
  //
  //   const positionElement = (e)=> {
  //
  //     const rect = canvas.getBoundingClientRect();
  //     const mouseX = e.clientX - rect.left - brushSize / 2;
  //     const mouseY = e.clientY - rect.top - brushSize / 2;
  //     console.log("mouseY", mouseY)
  //     console.log("mouseX", mouseX)
  //
  //     cursorSmall.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
  //
  //   }
  //
  //   window.addEventListener('mousemove', positionElement)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current;

    const cursorOverlay = document.getElementById('cursor-image');

    canvas.addEventListener('mouseenter', () => {
      cursorOverlay.style.display = 'block';
    });

    canvas.addEventListener('mouseleave', () => {
      cursorOverlay.style.display = 'none';
    });
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current;

    const rect = canvas.getBoundingClientRect();
    const handleMouseMove = (event) => {

      setCursorPosition({ x: event.clientX - rect.left - brushSize / 2, y: event.clientY - rect.top - brushSize / 2 });
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [brushSize]);

  const zoomed = (number) => {
    return Math.floor(number * scale);
  };

  const zoomedX = (number) => {
    return Math.floor((number - worldX) * scale + mouseX);
  };

  const zoomedY = (number) => {
    return Math.floor((number - worldY) * scale + mouseY);
  };

  const zoomedX_INV = (number) => {
    return Math.floor((number - mouseX) * (1 / scale) + worldX);
  };

  const zoomedY_INV = (number) => {
    return Math.floor((number - mouseY) * (1 / scale) + worldY);
  };

  // const handleMouseDown = (e) => {
  //   setMouseButton(1);
  // };

  // const handleMouseUp = (e) => {
  //   setMouseButton(0);
  // };

  function drawImageScaled(img, ctx) {
    let canvas = ctx.canvas;
    let hRatio = canvas.width  / img.width;
    let vRatio =  canvas.height / img.height;
    let ratio  = Math.min ( hRatio, vRatio );
    let centerShift_x = ( canvas.width - img.width * ratio ) / 2;
    let centerShift_y = ( canvas.height - img.height * ratio ) / 2;
    ctx.clearRect(0,0, canvas.width, canvas.height);
    if (img.width > img.height) {
      ctx.drawImage(img, -20, 0, canvas.width + 40, canvas.height, centerShift_x, centerShift_y, img.width * ratio, img.height * ratio);
    } else {
      ctx.drawImage(img, 0, 0, img.width, img.height, centerShift_x, centerShift_y, img.width * ratio, img.height * ratio);
    }
    addToHistory(canvas);
  }
  // useEffect(() => {
  //   draw();
  // }, [scale, worldX, worldY]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (imageData) {
      const image = new Image();
      image.src = imageData;
      image.onload = () => drawImageScaled(image, ctx);

    }
  }, [imageData]);

  const addToHistory = (canvas) => {
    const data = canvas.toDataURL('image/png');
    setHistory((prevHistory) => [...prevHistory.slice(0, historyIndex + 1), data]);
    setHistoryIndex((prevIndex) => prevIndex + 1);
  };

  const handleRestore = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (originalImageData) {
      const image = new Image();
      image.src = originalImageData;
      image.onload = () => drawImageScaled(image, ctx);

    }
  };

  const draw = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.beginPath();
    ctx.rect(zoomedX(50), zoomedY(50), zoomed(100), zoomed(100));
    ctx.fillStyle = 'skyblue';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(zoomedX(350), zoomedY(250), zoomed(50), 0, 2 * Math.PI, false);
    ctx.fillStyle = 'green';
    ctx.fill();
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      setImageData(event.target.result);
      setOriginalImageData(event.target.result);
    };

    if (file) {
      reader.readAsDataURL(file);
    }
  };

  const handleMouseDown = (e) => {
    // e.preventDefault();
    // e.stopPropagation();
    if(erase) {
      setIsDrawing(true);
    }
    else {
      setMouseButton(1);
    }
  };

  const handleMouseUp = () => {
    if (erase) {
      setIsDrawing(false);
      const canvas = canvasRef.current;
      addToHistory(canvas);
    } else {
      setMouseButton(0);
    }

  };

  const handleTouchStart = (e) => {
    e.preventDefault();
    const touch = e.changedTouches[0];
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    setIsDrawing(true);

    const ctx = canvas.getContext('2d');
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, brushSize / 2, 0, 2 * Math.PI);
    ctx.clip();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex((prevIndex) => prevIndex - 1);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const image = new Image();
      image.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      };
      image.src = history[historyIndex - 1];
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex((prevIndex) => prevIndex + 1);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const image = new Image();
      image.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      };
      image.src = history[historyIndex + 1];
    }
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    if (!isDrawing) return;

    const touch = e.changedTouches[0];
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, brushSize / 2, 0, 2 * Math.PI);
    ctx.clip();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  };

  const handleTouchEnd = (e) => {
    e.preventDefault();
    setIsDrawing(false);
  };
  const handleMouseMove = (e) => {
    // e.preventDefault();
    // e.stopPropagation();
    // const canvas = canvasRef.current;
    // const rect = canvas.getBoundingClientRect();
    // const x = e.clientX - rect.left;
    // const y = e.clientY - rect.top;
    // const xx = mouseRX;
    // const yy = mouseRY;
    // console.log('handleMouseMove', xx, yy)
    //
    // setMouseX(x);
    // setMouseY(y);
    //
    // setMouseRX(zoomedX_INV(x));
    // setMouseRY(zoomedY_INV(y));
    //
    // if (mouseButton === 1) {
    //   setWorldX((prevWorldX) => prevWorldX - (mouseRX - xx));
    //   setWorldY((prevWorldY) => prevWorldY - (mouseRY - yy));
    //
    //   setMouseRX(zoomedX_INV(x));
    //   setMouseRY(zoomedY_INV(y));
    //   draw();
    // }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (!isDrawing) return;
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, brushSize / 2, 0, 2 * Math.PI);
    ctx.clip();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  };

  const handleBrushSizeChange = (e) => {
    setBrushSize(parseInt(e.target.value, 10));
  };

  const handleSetErase = () => {
    setErase(prevState => !prevState)
  }
  const handleDownload = () => {
    const canvas = canvasRef.current;
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = 'transparent_image.png';
    link.click();
  };

  return (
    <div className="image-editor-container">
    <div id="canvas-container" className="canvas-container">
      {history.length ? <div className="history-actions">
        <Button variant="text" onClick={handleUndo}><UndoIcon/></Button>
        <Button variant="text" onClick={handleRedo}><RedoIcon/></Button>
      </div> : ''
      }
      <TransformWrapper
        initialScale={1}
        disabled={erase}
      >
        {({ zoomIn, zoomOut, resetTransform, ...rest }) => {
          return (
            <>
              <div className="zoom-actions">
                <button onClick={() => zoomIn()}>+</button>
                <button onClick={() => zoomOut()}>-</button>
                {/*<button onClick={() => resetTransform()}>x</button>*/}
              </div>
              <TransformComponent>
                <canvas
                  className="canvas-area"
                  ref={canvasRef}
                  id="myCanvas"
                  onMouseDown={handleMouseDown}
                  onMouseUp={handleMouseUp}
                  onMouseMove={handleMouseMove}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                />
              </TransformComponent>
            </>
          )
        }}
      </TransformWrapper>

      <div id="cursor-image" style={{ width: brushSize, height: brushSize, left: cursorPosition.x, top: cursorPosition.y }}/>
    </div>
      <List className="list-container">
      <ListItem>
        <Button sx={{ margin: '10px 0' }} fullWidth size="medium" variant="contained" onClick={handleDownload}>Download</Button>
      </ListItem>
      <Divider />
        <ListItem sx={{
          justifyContent: 'space-between',
        }}>
        <Typography variant="subtitle1" align="left" gutterBottom>
          Erase / Restore
        </Typography>
        <Button onClick={handleRestore}>Origin</Button>
        </ListItem>
        <ListItem sx={{
          justifyContent: 'space-between',
        }}>
          <Button variant="outlined" color={erase ? 'primary' : 'secondary'} onClick={handleSetErase}>Erase</Button>
        </ListItem>
          <ListItem sx={{
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
          <Typography margin={0} variant="subtitle2" align="left" gutterBottom>
            Brush Size:
          </Typography>
            {brushSize}
          </ListItem>
          <ListItem sx={{
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
        <Slider
          aria-label="Always visible"
          id="brushSize"
          value={brushSize}
          onChange={handleBrushSizeChange}
        />
          </ListItem>
      <ListItem sx={{ justifyContent: 'center', alignItems: 'center'}}>
        <Button variant="outlined" component="label" onChange={handleFileUpload}>
          Upload File
          <input type="file" hidden />
        </Button>
      </ListItem>
      </List>
    </div>
  );
};

export default Editor;
