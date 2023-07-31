import { useRef, useState, Fragment, useEffect } from 'react';
import Button from '@mui/material/Button';
import { Stage, Layer, Image, Transformer } from 'react-konva';
import List from '@mui/material/List';
import classes from './ImageEditor.module.css';
import ListItem from '@mui/material/ListItem';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import DeleteIcon from '@mui/icons-material/Delete';
import { v4 as uuidv4 } from 'uuid';

function blobToBase64(blob) {
  return new Promise((resolve, _) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

const cropTransparentPixels = async (blob) => {
  try {
    const bitmap = await createImageBitmap(blob);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const { width, height } = bitmap;

    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(bitmap, 0, 0);

    const imageData = ctx.getImageData(0, 0, width, height);
    const { data } = imageData;

    let minX = width;
    let minY = height;
    let maxX = 0;
    let maxY = 0;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const alpha = data[(y * width + x) * 4 + 3];
        if (alpha !== 0) {
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
    }

    const croppedWidth = maxX - minX + 1;
    const croppedHeight = maxY - minY + 1;

    const croppedCanvas = document.createElement('canvas');
    const croppedCtx = croppedCanvas.getContext('2d');
    croppedCanvas.width = croppedWidth;
    croppedCanvas.height = croppedHeight;

    croppedCtx.drawImage(canvas, minX, minY, croppedWidth, croppedHeight, 0, 0, croppedWidth, croppedHeight);

    const croppedBlob = await new Promise((resolve) =>
      croppedCanvas.toBlob(resolve, 'image/png')
    );

    return croppedBlob;
  } catch (error) {
    console.error('Error cropping transparent pixels:', error);
    throw error;
  }
};


const ImageShape = ({ onSelect, image, isSelected }) => {
  const shapeRef = useRef(null);
  const trRef = useRef(null);

  useEffect(() => {
    if (trRef.current && isSelected) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  return (
    <Fragment>
      <Image
        id={image.id}
        className={image.id}
        image={image.img}

        zIndex={image.zIndex}
        ref={shapeRef}
        onMouseDown={onSelect}
        onTouchStart={onSelect}
        draggable
      />
      {isSelected && (
        <Transformer
          ref={trRef}
        />
      )}
    </Fragment>
  )
}

const ImageBuilder = () => {
  const [images, setImages] = useState([]);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const stageRef = useRef(null);
  const canvasWrapperRef = useRef(null);

  useEffect(() => {
    const updateCanvasSize = () => {
      const { clientWidth, clientHeight } = canvasWrapperRef.current;
      setCanvasSize({ width: clientWidth, height: clientHeight });
    };

    // Initial canvas size
    updateCanvasSize();
  }, []);

  const handleImageUpload = (e) => {

    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = () => {
      const img = new window.Image();
      img.src = reader.result;
      img.onload = () => {
        cropTransparentPixels(img).then( async blobObject => {
          const croppedImg = new window.Image();
          const blobBase64 = await blobToBase64(blobObject)
          croppedImg.src = blobBase64;

          setImages([...images, { name: file.name, id: uuidv4(), src: URL.createObjectURL(blobObject), img: croppedImg }]);
        })
      };

    };

    if (file) {
      reader.readAsDataURL(file);
    }
    e.target.value = null
  };

  const handleSelect = (id) => {
    setImages((prevImages) => {
      // Toggle isSelected state of the clicked image
      const updatedImages = prevImages.map((image) => {
        return image.id === id ? { ...image, isSelected: true } : { ...image, isSelected: false }

      });
      return updatedImages;
    });
  };



  const getCanvasElementFromStage = stageRef => {
    if (!stageRef || !stageRef.current) {
      return null; // Return null or handle the case when the Stage ref is not available
    }

    // The stageRef.current contains the actual Konva Stage instance
    const konvaStage = stageRef.current.getStage();

    // Use the Konva Stage instance to get the canvas element
    if (konvaStage && konvaStage.content) {
      return konvaStage.content;
    }

    return null; // Return null or handle the case when the canvas element is not available
  };

  const handleDownload = () => {

    setImages((prevImages) =>  prevImages.map(image => ({ ...image, isSelected: false })));

    setTimeout(() => {

      cropTransparentPixels(getCanvasElementFromStage(stageRef).firstChild).then(result => {
        const link = document.createElement('a');
        link.download = 'canvas_image.png';
        link.href = URL.createObjectURL(result);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      })

    }, 0)
  };

  const handleBringToFront = (id) => {
    setImages((prevImages) => {
      const updatedImages = prevImages.map((image) => {
        if (image.id === id) {
          return { ...image, zIndex: Date.now() }; // Set a new zIndex to move it to the front
        }
        return image;
      });
      return updatedImages;
    });
  };

  const handleDeleteImage = (id) => {
    setImages((prevImages) => {
      // Increase the zIndex of the selected image to bring it to the front
      const updatedImages = prevImages.filter((image) => {
        if (image.id !== id) {
          return image;
        }
      });
      return updatedImages;
    });
  }
  const checkDeselect = (e) => {
    // deselect when clicked on empty area
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      setImages((prevImages) => {
        // Toggle isSelected state of the clicked image
        const updatedImages = prevImages.map((image) => {
          return { ...image, isSelected: false }

        });
        return updatedImages;
      });
    }
  };

  return (
    <div className={classes.imageEditor}  style={{touchAction:  "none"}}>
      <div style={{ display: "flex", width: "100%", justifyContent: "space-between", alignItems: "start" }}>
        <div ref={canvasWrapperRef} className={classes.canvasContainer}>
          <Stage
            width={canvasSize.width}
            height="500"
            onMouseDown={checkDeselect}
            onTouchStart={checkDeselect}
            ref={stageRef}
          >
            <Layer>
              {images.map((image) => (
                <ImageShape
                  onSelect={() => handleSelect(image.id)}
                  image={image}
                  isSelected={image.isSelected}
                  key={image.id}
                />
              ))}
            </Layer>
          </Stage>
        </div>
          <List className={classes.listContainer}>
            <ListItem>
              <Button disabled={!images.length} className={classes.downloadButton} fullWidth size="medium" variant="contained" onClick={handleDownload}>
                <FileDownloadIcon sx={{ marginRight: '10px' }} />
                Download
              </Button>
            </ListItem>
            <ListItem sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}}>
              <Button variant="outlined" component="label" onChange={handleImageUpload}>
                <FileUploadIcon sx={{ marginRight: '10px' }} />
                Upload File
                <input type="file" hidden accept=".png,.jpg,.jpeg" />
              </Button>
            </ListItem>
            {images.length ? images.map((data, index) => {
              return (
                <ListItem
                  key={index}

                  secondaryAction={
                    <>
                      <IconButton edge="end" aria-label="bring to front" onClick={() => handleBringToFront(data.id)}>
                        <ArrowUpwardIcon />
                      </IconButton>
                      <IconButton sx={{ marginLeft: "20px" }} edge="end" aria-label="delete" onClick={() => handleDeleteImage(data.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </>
                  }
                >
                  <ListItemAvatar>
                    <Avatar variant="square"  sx={{ bgcolor: "transparent" }}>
                      <img width="100%" height="100%" style={{ objectFit: 'contain' }} src={data.src} />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText primary={data.name} />
                </ListItem>
              )
            }) : ''}
          </List>
        </div>
    </div>
  );
};

export default ImageBuilder;
