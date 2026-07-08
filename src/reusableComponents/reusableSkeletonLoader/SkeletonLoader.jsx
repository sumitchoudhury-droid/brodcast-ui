import "./skeletonLoader.scss";

const SkeletonLoader = ({
  className = "",
  width,
  height,
  borderRadius = "4px",
  maxWidth = "100%",
  background
}) => {
  return (
    <>
      <span
        className={`skeleton ${className && className}`}
        style={{
          width,
          height,
          borderRadius,
          background: background,
          maxWidth: maxWidth
        }}
      ></span>
    </>
  );
};

export default SkeletonLoader;
