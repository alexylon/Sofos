import React from "react";
import Box from "@mui/material/Box";
import {Grid, Input, Slider} from "@mui/material";
import ThermostatIcon from "@mui/icons-material/Thermostat";


export default function TemperatureSlider({handleTemperatureInputChange, setTemperatureValue, temperatureValue}: any) {

    const handleSliderChange = (event: Event, newValue: number | number[]) => {
        setTemperatureValue(newValue);
    };

    const handleBlur = () => {
        if (!Array.isArray(temperatureValue)) {
            if (temperatureValue < 0) {
                setTemperatureValue(0);
            } else if (temperatureValue > 2) {
                setTemperatureValue(2);
            }
        }
    }

    const marks = [
        {
            value: 0,
            label: '0',
        },
        {
            value: 2,
            label: '2',
        },
    ];

    return (
        <>
            <Box sx={{width: 350}}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item>
                        <ThermostatIcon/>
                    </Grid>
                    <Grid item xs>
                        <Slider
                            value={temperatureValue}
                            onChange={handleSliderChange}
                            step={0.1}
                            min={0}
                            max={2}
                            marks={marks}
                            aria-labelledby="input-slider"
                        />
                    </Grid>
                    <Grid item>
                        <Box sx={{p: 1, marginTop: -6}}>
                            <Input
                                value={temperatureValue}
                                size="small"
                                onChange={handleTemperatureInputChange}
                                onBlur={handleBlur}
                                inputProps={{
                                    step: 0.1,
                                    min: 0,
                                    max: 2.0,
                                    type: 'number',
                                    'aria-labelledby': 'input-slider',
                                }}
                            />
                        </Box>
                    </Grid>
                </Grid>
            </Box>
        </>
    )
}
