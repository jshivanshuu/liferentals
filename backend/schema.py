from pydantic import BaseModel
from typing import Literal
class user(BaseModel):
    userid : int
    name : str
    age : int
    gender : Literal["Male","Female","Other"]
    email : str
    phone : int
    password : str
    role : Literal["buyer","seller"]

class property(BaseModel):
    propertyid : int
    ownerid : int
    title : str
    description : str
    price : int
    location : str
    type : Literal["apartment","house"]
    bedrooms : int
    bathrooms : int
    city : str
    state : str
    country : str
    availability : bool
    images : list[str]


class booking(BaseModel):
    bookingid : int
    propertyid : int
    buyerid : int
    start_date : str
    end_date : str
    total_price : int


class review(BaseModel):
    id : int
    propertyid : int
    buyerid : int
    rating : int
    comment : str


class wishlist(BaseModel):
    id : int
    buyerid : int
    propertyid : int

