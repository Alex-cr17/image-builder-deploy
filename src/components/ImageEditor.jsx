import { useState, useRef, useEffect } from 'react';
import Button from '@mui/material/Button';
import Slider from '@mui/material/Slider';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import Typography from '@mui/material/Typography';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';
import Stack from '@mui/material/Stack';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import ZoomOutMapIcon from '@mui/icons-material/ZoomOutMap';
import Switch  from '@mui/material/Switch';
import {TransformWrapper, TransformComponent} from "react-zoom-pan-pinch";

import classes from './ImageEditor.module.css';
const BORDER_WIDTH = 2;

const Editor = () => {
  const canvasRef = useRef(null);
  const canvasWrapperRef = useRef(null);
  const cursorRef = useRef(null);
  const [brushSize, setBrushSize] = useState(10);
  const [imageData, setImageData] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [originalImageData, setOriginalImageData] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [erase, setErase] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [{ scale, positionX, positionY }, setTransformedState] = useState({ scale: 1, positionX: 0, positionY: 0 });

  useEffect(() => {
    const updateCanvasSize = () => {
      const { clientWidth, clientHeight } = canvasWrapperRef.current;
      setCanvasSize({ width: clientWidth, height: clientHeight });
    };

    // Initial canvas size
    updateCanvasSize();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;

    const rect = canvas.getBoundingClientRect();
    const handleMouseMove = (event) => {
      setCursorPosition({ x: event.clientX - rect.left + positionX - BORDER_WIDTH - brushSize / 2, y: event.clientY - rect.top + positionY - BORDER_WIDTH - brushSize / 2 });
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [brushSize, positionX, positionY]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (imageData) {
      const image = new Image();
      image.onload = () => drawImageScaled(image, ctx);
      image.src = imageData;

    }
  }, [imageData]);

  const loadImage = (image) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    image.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    };
  }

  const drawImageScaled = (img, ctx) => {
    let canvas = ctx.canvas;
    let hRatio = canvas.width  / img.width;
    let vRatio =  canvas.height / img.height;
    let ratio  = Math.min ( hRatio, vRatio );
    let centerShift_x = ( canvas.width - img.width * ratio ) / 2;
    let centerShift_y = ( canvas.height - img.height * ratio ) / 2;
    ctx.clearRect(0,0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, img.width, img.height, centerShift_x, centerShift_y, img.width * ratio, img.height * ratio);

    addToHistory(canvas);
  }

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
      image.onload = () => drawImageScaled(image, ctx);
      image.src = originalImageData;
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
    if(erase && imageData) {
      setIsDrawing(true);
    }
  };

  const handleMouseUp = () => {
    if (erase && imageData) {
      setIsDrawing(false);
      const canvas = canvasRef.current;
      addToHistory(canvas);
    }
  };

  const handleTouchStart = () => {
    if(erase && imageData) {
      setIsDrawing(true);
    }
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex((prevIndex) => prevIndex - 1);
      const image = new Image();
      loadImage(image)
      image.src = history[historyIndex - 1];
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex((prevIndex) => prevIndex + 1);
      const image = new Image();
      loadImage(image)
      image.src = history[historyIndex + 1];
    }
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    if(erase && imageData) {
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
    }
  };

  const handleTouchEnd = (e) => {
    e.preventDefault();
    setIsDrawing(false);
  };
  const handleMouseMove = (e) => {
    e.preventDefault();

    if(erase && imageData) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / scale;
      const y = (e.clientY - rect.top) / scale;

      if (!isDrawing) return;
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, brushSize / 2 / scale, 0, 2 * Math.PI);
      ctx.clip();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    }
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
    <div className={classes.imageEditor}  style={{touchAction:  "none"}}>
      <TransformWrapper
        initialScale={scale}
        disabled={erase || !imageData}
        centerOnInit
        onTransformed={(ref, state ) => {
          setTransformedState(state);
        }}
      >
        {({ zoomIn, zoomOut, resetTransform }) => {
          return (
            <div className={classes.imageEditorWrapper}>
              {history.length ? <div className={classes.historyActions}>
                <Button variant="text" onClick={handleUndo}><UndoIcon/></Button>
                <Button variant="text" onClick={handleRedo}><RedoIcon/></Button>
              </div> : ''
              }
              <div ref={canvasWrapperRef} className={classes.canvasContainer}>
                <TransformComponent>
                  <canvas
                    className={erase && imageData ? classes.erasing : !erase && imageData ? classes.zooming : ''}
                    ref={canvasRef}
                    width={canvasSize.width}
                    height={canvasSize.height}
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
                    onMouseMove={handleMouseMove}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                  />
                </TransformComponent>
                { erase && imageData &&
                  <div
                    ref={cursorRef}
                    className={classes.customCursor}
                    style={{ width: brushSize, height: brushSize, left: cursorPosition.x , top: cursorPosition.y }}
                  />
                }
              </div>
              {imageData && <div className={classes.zoomActions}>
                <Button onClick={() => zoomOut()}>
                  <RemoveIcon/>
                </Button>
                <Button disabled>
                  {parseInt(scale * 100, 10)}%
                </Button>
                <Button onClick={() => zoomIn()}>
                  <AddIcon/>
                </Button>
                <Button sx={{marginLeft: '10px'}} onClick={() => resetTransform()}>Preview</Button>
              </div>
              }
            </div>
          )
        }}
      </TransformWrapper>
      <List className={classes.listContainer}>
        <ListItem>
          <Button disabled={!imageData} className={classes.downloadButton} fullWidth size="medium" variant="contained" onClick={handleDownload}>
            <FileDownloadIcon sx={{ marginRight: '10px' }} />
            Download
          </Button>
        </ListItem>
        <Divider />
        <ListItem sx={{ justifyContent: 'space-between' }}>
          <Typography variant="subtitle1" align="left" gutterBottom>
            Erase / Restore
          </Typography>
          <Button onClick={handleRestore}>Origin</Button>
        </ListItem>
        <ListItem sx={{ justifyContent: 'space-between'}}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography display="flex" alignItems="center"><ZoomOutMapIcon />Move</Typography>
              <Switch checked={erase} onChange={handleSetErase}  />
            <Typography display="flex" alignItems="center"><AutoFixHighIcon /> Erase </Typography>
          </Stack>
        </ListItem>
        <ListItem sx={{ justifyContent: 'space-between',  alignItems: 'center'}}>
          <Typography margin={0} variant="subtitle2" align="left" gutterBottom>
            Brush Size:
          </Typography>
            {brushSize}
        </ListItem>
        <ListItem sx={{ justifyContent: 'space-between', alignItems: 'center'}}>
          <Slider
            aria-label="Always visible"
            id="brushSize"
            value={brushSize}
            onChange={handleBrushSizeChange}
          />
        </ListItem>
        <ListItem sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}}>
          <Button variant="outlined" component="label" onChange={handleFileUpload}>
            <FileUploadIcon sx={{ marginRight: '10px' }} />
              Upload File
            <input type="file" hidden accept=".png,.jpg,.jpeg" />
          </Button>
          <Typography variant="body2" sx={{color: 'gray', padding: '10px' }}>Accept formats: png, jpg, jpeg</Typography>
        </ListItem>
      </List>
    </div>
  );
};

export default Editor;
