import { useState, useRef, useEffect } from 'react';
import Button from '@mui/material/Button';
import Slider from '@mui/material/Slider';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import Typography from '@mui/material/Typography';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';
import Stack from '@mui/material/Stack';
import { styled } from '@mui/material/styles';
import Switch  from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

const MaterialUISwitch = styled(Switch)(({ theme }) => ({
  width: 62,
  height: 34,
  padding: 7,
  '& .MuiSwitch-switchBase': {
    margin: 1,
    padding: 0,
    transform: 'translateX(6px)',
    '&.Mui-checked': {
      color: '#fff',
      transform: 'translateX(22px)',
      '& .MuiSwitch-thumb:before': {
        backgroundImage: `url('data:image/svg+xml;utf8,<svg focusable="false" aria-hidden="true" viewBox="0 0 24 24"  xmlns="http://www.w3.org/2000/svg" height="20" width="20"><path fill="${encodeURIComponent(
          '#fff',
        )}" d="M7.5 5.6 10 7 8.6 4.5 10 2 7.5 3.4 5 2l1.4 2.5L5 7zm12 9.8L17 14l1.4 2.5L17 19l2.5-1.4L22 19l-1.4-2.5L22 14zM22 2l-2.5 1.4L17 2l1.4 2.5L17 7l2.5-1.4L22 7l-1.4-2.5zm-7.63 5.29a.9959.9959 0 0 0-1.41 0L1.29 18.96c-.39.39-.39 1.02 0 1.41l2.34 2.34c.39.39 1.02.39 1.41 0L16.7 11.05c.39-.39.39-1.02 0-1.41l-2.33-2.35zm-1.03 5.49-2.12-2.12 2.44-2.44 2.12 2.12-2.44 2.44z"></path></svg>')`,
      },
      '& + .MuiSwitch-track': {
        opacity: 1,
        backgroundColor: theme.palette.mode === 'dark' ? '#8796A5' : '#aab4be',
      },
    },
  },
  '& .MuiSwitch-thumb': {
    backgroundColor: theme.palette.mode === 'dark' ? '#003892' : '#001e3c',
    width: 32,
    height: 32,
    '&:before': {
      content: "''",
      position: 'absolute',
      width: '100%',
      height: '100%',
      left: 0,
      top: 0,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
      backgroundImage: `url('data:image/svg+xml;utf8,<svg focusable="false" aria-hidden="true" viewBox="0 0 24 24"  xmlns="http://www.w3.org/2000/svg" height="20" width="20"><path fill="${encodeURIComponent(
        '#fff',
      )}" d="m15 3 2.3 2.3-2.89 2.87 1.42 1.42L18.7 6.7 21 9V3h-6zM3 9l2.3-2.3 2.87 2.89 1.42-1.42L6.7 5.3 9 3H3v6zm6 12-2.3-2.3 2.89-2.87-1.42-1.42L5.3 17.3 3 15v6h6zm12-6-2.3 2.3-2.87-2.89-1.42 1.42 2.89 2.87L15 21h6v-6z"></path></svg>')`,
    },
  },
  '& .MuiSwitch-track': {
    opacity: 1,
    backgroundColor: theme.palette.mode === 'dark' ? '#8796A5' : '#aab4be',
    borderRadius: 20 / 2,
  },
}));

const PADDING_CANVAS = 0; // padding percentage

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
      ctx.drawImage(img, -(canvas.width / 100 * PADDING_CANVAS), 0, canvas.width - (canvas.width / 100 * PADDING_CANVAS * 2), canvas.height, centerShift_x, centerShift_y, img.width * ratio, img.height * ratio);
    } else {
      ctx.drawImage(img, 0, -(img.height / 100 * PADDING_CANVAS), img.width, img.height - (img.height / 100 * PADDING_CANVAS * 2), centerShift_x, centerShift_y, img.width * ratio, img.height * ratio);
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

  const handleTouchStart = () => {
    if(erase) {
      setIsDrawing(true);
    }
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
                <Button onClick={() => zoomOut()}>
                  <RemoveIcon />
                </Button>
                <Button disabled>
                  {parseInt(scale * 100, 10)}%
                </Button>
                <Button onClick={() => zoomIn()}>
                  <AddIcon />
                </Button>
                <Button sx={{ marginLeft: '10px' }} onClick={() => resetTransform()}>Preview</Button>
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

      <div id="cursor-image" style={{ display: 'block' ? erase : 'none', width: brushSize * scale, height: brushSize * scale, left: cursorPosition.x , top: cursorPosition.y }}/>
    </div>
      <List className="list-container">
      <ListItem>
        <Button disabled={!imageData} sx={{ margin: '10px 0' }} fullWidth size="medium" variant="contained" onClick={handleDownload}>
          <FileDownloadIcon sx={{ marginRight: '10px' }} />
          Download
        </Button>
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
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography>Move</Typography>
            <FormControlLabel
              control={<MaterialUISwitch checked={erase} onChange={handleSetErase} />}
            />
            <Typography>Erase</Typography>
          </Stack>
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
          <FileUploadIcon sx={{ marginRight: '10px' }} />
          Upload File
          <input type="file" hidden />
        </Button>
      </ListItem>
      </List>
    </div>
  );
};

export default Editor;
