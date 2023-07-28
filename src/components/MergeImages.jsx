import { useRef, useState, Fragment, useEffect } from 'react';
import Button from '@mui/material/Button';
import { Stage, Layer, Image, Transformer } from 'react-konva';
import List from '@mui/material/List';
import classes from './ImageEditor.module.css';
import ListItem from '@mui/material/ListItem';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FileUploadIcon from '@mui/icons-material/FileUpload';

const ImageShape = ({ onSelect, image, onBringToFront, isSelected }) => {
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
        onMouseDown={onBringToFront}
        onTouchStart={onBringToFront}
        ref={shapeRef}
        onClick={onSelect}
        onTouchEnd={onSelect}
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
  const stageRef = useRef(null);
  const [images, setImages] = useState([]);
  const canvasWrapperRef = useRef(null);


  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = () => {
      const img = new window.Image();
      img.src = reader.result;

      img.onload = () => {
        setImages([...images, { name: file.name, id: images.length + 1, src: reader.result, img }]);
      };
    };

    if (file) {
      reader.readAsDataURL(file);
    }
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

  const handleDownload = () => {
    const dataURL = stageRef.current.toDataURL();
    const link = document.createElement('a');
    link.download = 'canvas_image.png';
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBringToFront = (id) => {
    setImages((prevImages) => {
      // Increase the zIndex of the selected image to bring it to the front
      const updatedImages = prevImages.map((image) => {
        if (image.id === id) {
          return { ...image, zIndex: Date.now() }; // Set a new zIndex to move it to the front
        }
        return image;
      });
      return updatedImages;
    });
  };

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
            width="800"
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
                  onBringToFront={() => handleBringToFront(image.id)}
                  key={image.name}
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
            {images.length ? images.map((file, index) => {
              return (
                <ListItem  key={index} sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}}>
                  <div>{file.name}</div>
                </ListItem>
              )
            }) : ''}
          </List>
        </div>
    </div>
  );
};

export default ImageBuilder;
