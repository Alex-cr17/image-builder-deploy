import ImageEditor from './components/ImageEditor';
import MergeImages from './components/MergeImages';
import { Routes, Route, Link, Outlet } from "react-router-dom";
import './App.css'

function App() {

  return (
    <>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<MergeImages />} />
          <Route path="builder" index element={<ImageEditor />} />
          <Route path="*" element={<p>There's nothing here: 404!</p>} />
          {/* Using path="*"" means "match anything", so this route
                acts like a catch-all for URLs that we don't have explicit
                routes for. */}
          {/*<Route path="*" element={<NoMatch />} />*/}
        </Route>
      </Routes>
      {/*<ImageEditor />*/}
    </>
  )
}

function Layout() {
  return (
    <div>
      {/* A "layout route" is a good place to put markup you want to
          share across all the pages on your site, like navigation. */}
      <nav>
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/builder">Image Editor</Link>
          </li>
        </ul>
      </nav>

      <hr />

      {/* An <Outlet> renders whatever child route is currently active,
          so you can think about this <Outlet> as a placeholder for
          the child routes we defined above. */}
      <Outlet />
    </div>
  );
}
export default App
