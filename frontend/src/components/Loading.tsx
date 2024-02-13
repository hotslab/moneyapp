import Spinner from "./Spinner";

function Loading() {
    return (
      <>
        <div className="bg-white h-screen flex w-full justify-center items-center px-6 py-12 lg:px-8">
            <Spinner/>
            <span className="sr-only">Loading...</span>
        </div>
      </>
    );
}

export default Loading