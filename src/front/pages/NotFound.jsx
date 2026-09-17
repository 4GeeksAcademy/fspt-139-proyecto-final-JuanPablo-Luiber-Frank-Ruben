import { useNavigate, Link } from "react-router-dom"

export const NotFound = () => {
    const navigate = useNavigate()

    return (
        <>
            <div className="container">
                <img src="https://cdn.memegenerator.es/imagenes/memes/thumb/33/74/33744939.jpg" className="card-img-top" alt="..." />
                <div className="card-body">
                    <h5 className="card-title"></h5>
                    <p className="card-text">Identificate mamawebo.</p>
                    <button type="submit"
                        className="btn btn-primary"
                        onClick={
                            () => {
                                navigate("/")
                            }
                        }>
                        Go to Log in

                    </button>
                </div>
            </div>
        </>


    )
}