import { Html } from "@react-three/drei";

export default function ProjectCard({
  position = [0, 1.8, 0],
  title = "Project",
  summary = "",
  link = "#",
}) {
  return (
    <Html position={position} transform occlude>
      <div className="project-card">
        <strong>{title}</strong>
        <small>{summary}</small>
        <div style={{ marginTop: 8 }}>
          <a href={link} target="_blank" rel="noreferrer">
            Open project
          </a>
        </div>
      </div>
    </Html>
  );
}
