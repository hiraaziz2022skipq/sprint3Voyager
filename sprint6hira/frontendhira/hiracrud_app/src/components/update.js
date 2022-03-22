import React, {useState} from 'react';
import Button from '@mui/material/Button';
import axios from 'axios'
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
export const Update_mongodb = () => {

  const [oldurls,setoldurl] = useState("")
  const [updateurls,setupdateurl] = useState("")
 

  async function updateURL(){

    try{
      // let res = await api.put('/',{url:oldurls,updateurl:updateurls})
      let res = await axios.put("http://localhost:3001/",
      {url:oldurls,updateurl:updateurls});
      console.log(res)
      }
      catch(err){
        console.log(err)
      }
  }


      
      const cardupdate = (
        <React.Fragment>
          <CardContent>
            <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
              Enter Old URL
            </Typography>
    
            <Typography variant="h5" component="div">
            <TextField
              required
              id="filled-required"
              variant="filled"
              onChange={(event) => {setoldurl(event.target.value)}}
            />
            </Typography>
            <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
              Enter New URL
            </Typography>
            <Typography variant="h5" component="div">
            <TextField
              required
              id="filled-required"
              variant="filled"
              onChange={(event) => {setupdateurl(event.target.value)}}
            />
            </Typography>
    
          </CardContent>
          <CardActions>
          <Button variant="contained" onClick={updateURL}>Update</Button>
          </CardActions>
        </React.Fragment>
      );

      
    return(
      <>

      <Box sx={{ minWidth: 275 }}>
      <Card variant="outlined">{cardupdate}</Card>
      </Box>

      </>
    )
}