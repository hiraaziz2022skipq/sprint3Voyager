import React, {useState} from 'react';
import Button from '@mui/material/Button';
import axios from 'axios'
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
export const Search_mongodb = () => {

    const [searchurl, setsearchurl] = useState("")
    const [searchdata,setsearchdata] =useState([])
 

    async function searchURL(){
        try{
        // let res = await api.get('/')
        let res = await axios.get(`http://localhost:3001/search/${searchurl}`);
        setsearchdata(res.data)
        console.log(res)
        }
        catch(err){
          console.log(err)
        }
      }


      
      const cardsearch = (
        <React.Fragment>
          <CardContent>
            <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
              Enter URL to Search
            </Typography>
    
            <Typography variant="h5" component="div">
                <TextField
                required
                id="filled-required"
                variant="filled"
                onChange={(event) => {setsearchurl(event.target.value)}}
                />
            </Typography>        
    
          </CardContent>
          <CardActions>
          <Button variant="contained" onClick={searchURL}>Search</Button>
          </CardActions>
        </React.Fragment>
      );

      
    return(
      <>

      <Box sx={{ minWidth: 275 }}>
      <Card variant="outlined">{cardsearch}</Card>
      </Box>
      {searchdata.map(url=> 
        <p key={url.id}>{url.url}
        </p>)}

      </>
    )
}