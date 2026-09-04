import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";
import useFavorites from "../hooks/useFavorites";
import { api } from "../services/api";
import { Gamecard } from "../components/GameCard";

const FILTERS = [
    {key: "all", Label: "Todos"},
    {key: "favorites", label: "Favoritos"},
    {key: "recent", label: "Mas jugados"},
];

//Endpoints para sacar los juegos del usuario

export const MyGames = () => {
    const { store } = useGlobalReducer();
    const { favorites, toggleFavorite } = useFavorites(store.token);

    const [ userGames, setUser ] = useState([]);
    const [error, setError] = useState("");
    const [ filter, setFilter ] = useState("all");
    const [ search, setsearch ] = useState("");
    

}