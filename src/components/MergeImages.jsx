import { useRef, useState, Fragment, useEffect } from 'react';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import ControlPointIcon from '@mui/icons-material/ControlPoint';
import { Stage, Layer, Image, Transformer } from 'react-konva';
const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 500;
const ZOOM = 0.4;

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
    console.log(id)
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
    <div style={{"display": "flex"}}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "start" }}>
        <label>Builder</label>
        <div style={{"display": "flex"}}>
          <Card>
            <Stage width={800} height={600}
                   onMouseDown={checkDeselect}
                   onTouchStart={checkDeselect}
                   ref={stageRef}
            >
              <Layer>
                {images.map((image, i) => (

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
          </Card>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            {images.length ? images.map((file, index) => {
              return (
                <div key={index}>{file.name}</div>
              )
            }) : ''}
            <div style={{ display: "flex"}}>
              <label htmlFor="file" style={{cursor: "pointer"}}><ControlPointIcon fontSize="large"/></label>
              <input type="file" hidden id="file" multiple onChange={handleImageUpload} />
            </div>
            <Button onClick={handleDownload}>Save as PNG</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageBuilder;
