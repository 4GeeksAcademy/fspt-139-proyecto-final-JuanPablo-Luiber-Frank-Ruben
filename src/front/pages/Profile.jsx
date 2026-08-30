export const Profile = () => {

    const connectSteam = async () => {

    const token = localStorage.getItem("token");

    const url = `${import.meta.env.VITE_BACKEND_URL}/api/steam/login`

    console.log("TOKEN:", token);
    console.log("URL:", url);

    const response = await fetch(url,
        {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );

    const data = await response.json();

    console.log("RESPUESTA:", response.status, data);

    //window.location.href = data.steam_login_url;
};



    return (
        <button onClick={connectSteam}>
            vincular Steam
        </button>
    )

}