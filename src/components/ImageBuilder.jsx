import { useRef, useState, useEffect } from 'react';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import interact from 'interactjs';
import ControlPointIcon from '@mui/icons-material/ControlPoint';

const ImageBuilder = () => {
  const canvasRef = useRef(null);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePositions, setImagePositions] = useState(null);

  useEffect(() => {
    interact('.resize-drag').resizable({
      // resize from all edges and corners
      edges: { left: true, right: true, bottom: true, top: true },

      listeners: {
        move (event) {
          var target = event.target
          var x = (parseFloat(target.getAttribute('data-x')) || 0)
          var y = (parseFloat(target.getAttribute('data-y')) || 0)

          // update the element's style
          target.style.width = event.rect.width + 'px'
          target.style.height = event.rect.height + 'px'

          // translate when resizing from top or left edges
          x += event.deltaRect.left
          y += event.deltaRect.top
          target.style.transform = 'translate(' + x + 'px,' + y + 'px)'

          target.setAttribute('data-x', x)
          target.setAttribute('data-y', y)
          // target.textContent = Math.round(event.rect.width) + '\u00D7' + Math.round(event.rect.height)
        },
        end (event) {
          var target = event.target
          var x = (parseFloat(target.getAttribute('data-x')) || 0)
          var y = (parseFloat(target.getAttribute('data-y')) || 0)

          // update the element's style
          target.style.width = event.rect.width + 'px'
          target.style.height = event.rect.height + 'px'

          // translate when resizing from top or left edges
          x += event.deltaRect.left
          y += event.deltaRect.top

          var index = (parseFloat(target.getAttribute('data-index')))

          handleImagePositionChange(index, x, y, event.rect.width, event.rect.height);

        }
      },
      modifiers: [
        // keep the edges inside the parent
        interact.modifiers.restrictEdges({
          outer: 'parent'
        }),

        // minimum size
        interact.modifiers.restrictSize({
          min: { width: 100, height: 50 }
        })
      ],

      inertia: true
    })
      .draggable({
        listeners: {
          move: window.dragMoveListener,
          end (event) {
            var target = event.target
            var x = (parseFloat(target.getAttribute('data-x')) || 0)
            var y = (parseFloat(target.getAttribute('data-y')) || 0)

            var index = (parseFloat(target.getAttribute('data-index')))

            handleImagePositionChange(index, x, y, event.rect.width, event.rect.height);

          }
        },
        inertia: true,
        modifiers: [
          interact.modifiers.restrictEdges({
            outer: 'parent'
          }),
          interact.modifiers.restrictRect({
            restriction: 'parent',
            endOnly: true
          })
        ]
      })

// this function is used later in the resizing and gesture demos
    window.dragMoveListener = dragMoveListener
  }, [imageFiles]);

  function dragMoveListener (event) {
    var target = event.target
    // keep the dragged position in the data-x/data-y attributes
    var x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx
    var y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy


    // translate the element
    target.style.transform = 'translate(' + x + 'px, ' + y + 'px)'

    // update the posiion attributes
    target.setAttribute('data-x', x)
    target.setAttribute('data-y', y)
  }

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    setImageFiles([...imageFiles, ...files]);
  };

  const handleImagePositionChange = (index, x, y, w, h) => {
    setImagePositions(prevState => ({...prevState, [index]: { x, y, w, h }}));
  };

  const mergeImages = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw each image onto the canvas
    imageFiles.forEach((file, index) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const { x, y, w, h } = imagePositions[index] || { x: 0, y: 0, w: 0, h: 0 };
        ctx.drawImage(img, x, y, w, h);
        URL.revokeObjectURL(img.src);
      };
    });
  };


  const saveAsPNG = () => {
    const canvas = canvasRef.current;
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = 'merged_image.png';
    link.click();
  };

  return (
    <div style={{"display": "flex"}}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "start" }}>
        <label>Builder</label>
      <div style={{"display": "flex"}}>
      <Card>
          <div style={{ width: '500px', height: '500px', position: 'relative' }}>
            {imageFiles.length ? imageFiles.map((file, index) => (
              <svg
                key={index}
                className="resize-drag"
                data-index={index}
                data-x={0}
                data-y={0}
                style={{ position: 'absolute', left: 0, right: 0, border: '1px solid gray' }}
              >
                <image href={URL.createObjectURL(file)} width="100%" height="100%" />
              </svg>
            )) : ''}
          </div>
      </Card>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          {imageFiles.length ? imageFiles.map((file, index) => {
            return (
              <div key={index}>{file.name}</div>
            )
          }) : ''}
          <div style={{ display: "flex"}}>
            <label htmlFor="file" style={{cursor: "pointer"}}><ControlPointIcon fontSize="large"/></label>
            <input type="file" hidden id="file" multiple onChange={handleImageUpload} />
          </div>
          <Button onClick={mergeImages}>Merge Images</Button>
          <Button onClick={saveAsPNG}>Save as PNG</Button>
        </div>
      </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "start" }}>
        <label>Preview</label>
        <Card>
          <canvas ref={canvasRef} width={500} height={500} />
        </Card>
      </div>
    </div>
  );
};

export default ImageBuilder;
