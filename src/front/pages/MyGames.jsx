import { useEffect, useMemo, useState } from "react";
import useGlobalReducer from "../hooks/useGlobalReducer";

const FILTERS = [
    {key: "all", Label: "Todos"},
    {key: "favorites", label: "Favoritos"},
    {key: "recent", label: "Mas jugados"},
];

//extraemos el payload del JWT del compañero

function getUserIdFromToken (token) {
    try {
        return JSON.parse(atob(token.split(".")[1])).sub;
    }   catch{
        return null;
    }
}

//Endpoints para sacar los juegos del usuario

export const MyGames = () => {
    const { store } = useGlobalReducer();
    const { favorites, toggleFavorite } = useFavorites(store.token);

    const [ userGames, setUser ] = useState([]);
    const [error, setError] = useState("");
    const [ filter, setFilter ] = useState("all");
    const [ search, setsearch ] = useState("");
    

}