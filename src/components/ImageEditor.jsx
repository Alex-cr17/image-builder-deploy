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
      setCursorPosition({ x: event.clientX - rect.left  - brushSize * scale / 2, y: event.clientY - rect.top / scale - brushSize * scale / 2 });
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [brushSize]);

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

  const handleMouseDown = () => {
    if(erase) {
      setIsDrawing(true);
    }
  };

  const handleMouseUp = () => {
    if (erase) {
      setIsDrawing(false);
      const canvas = canvasRef.current;
      addToHistory(canvas);
    }
  };

  const handleTouchStart = (e) => {
    e.preventDefault();
    const touch = e.changedTouches[0];
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (touch.clientX - rect.left) / scale;
    const y = (touch.clientY - rect.top) / scale;

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
    const x = (touch.clientX - rect.left) / scale;
    const y = (touch.clientY - rect.top) / scale;

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
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;

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
        initialScale={scale}
        disabled={erase}
        onTransformed={(ref, state ) => setScale(state.scale)}
      >
        {({ zoomIn, zoomOut, resetTransform }) => {
          return (
            <>
              <div className="zoom-actions">
                <Button onClick={() => zoomIn()}>+</Button>
                <Button onClick={() => zoomOut()}>-</Button>
                <Button onClick={() => resetTransform()}>Preview</Button>
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

      <div id="cursor-image" style={{ width: brushSize * scale, height: brushSize * scale, left: cursorPosition.x , top: cursorPosition.y }}/>
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
