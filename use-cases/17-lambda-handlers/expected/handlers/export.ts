import { getSeneca } from '../../env/lambda/lambda'

function complete(seneca: any) {
  seneca.listen({type:'sqs',pin:'sys:export,cmd:run'})
  seneca.client({type:'sqs',pin:'sys:store'})
}

exports.handler = async (
  event:any,
  context:any
) => {
  
  let seneca = await getSeneca('export', complete)
  
  let handler = seneca.export('gateway-lambda/handler')
  let res = await handler(event, context)
  return res
}
